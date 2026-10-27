import { Employee, Occurrence, AuditLog, AppUser, DashboardMetrics, Secretaria, Doctor, TenantInfo } from '../types/index.ts';
import { clientDb } from './localDatabase.ts';
import { signOutGoogle } from './googleAuth.ts';
import { firestoreService } from './firestore.ts';

class ApiService {
  private currentUser: AppUser | null = null;
  private activeTenantId: string = typeof window !== 'undefined' 
    ? (localStorage.getItem('ipme_active_tenant_id') || (window.location.hostname.includes('ais-dev') ? 'studio_sandbox' : 'ipme_eusebio')) 
    : 'ipme_eusebio';


  public getActiveTenantId(): string {
    return this.activeTenantId || 'ipme_eusebio';
  }

  public setActiveTenantId(tenantId: string): void {
    const clean = tenantId.trim().toLowerCase();
    this.activeTenantId = clean || 'ipme_eusebio';
    try {
      localStorage.setItem('ipme_active_tenant_id', this.activeTenantId);
      // Notifica componentes e sincroniza base local
      clientDb.setActiveTenant(this.activeTenantId);
      window.dispatchEvent(new CustomEvent('ipme_tenant_changed', { detail: { tenantId: this.activeTenantId } }));
    } catch {}
  }

  public getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  public setCurrentUser(user: AppUser | null) {
    this.currentUser = user;
    try {
      if (user) {
        localStorage.setItem('ipme_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('ipme_current_user');
      }
    } catch {}
  }

  public logout(): void {
    this.currentUser = null;
    try {
      localStorage.removeItem('ipme_current_user');
      sessionStorage.removeItem('ipme_current_user');
    } catch {}
    try {
      fetch('/api/auth/logout', { method: 'POST', headers: this.getHeaders() }).catch(() => {});
    } catch {}
    try {
      signOutGoogle().catch(() => {});
    } catch {}
  }

  public initUser(): AppUser | null {
    try {
      const stored = localStorage.getItem('ipme_current_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
    } catch {}
    this.currentUser = null;
    return null;
  }

  public hasUserSession(): boolean {
    return !!this.currentUser && !!this.currentUser.email;
  }

  private get actorEmail(): string {
    return this.currentUser?.email || "";
  }

  private get actorRole(): "admin" | "operator" {
    return this.currentUser?.role || "operator";
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-email': this.currentUser?.email || '',
      'x-user-role': this.currentUser?.role || 'operator',
      'x-tenant-id': this.getActiveTenantId(),
    };
  }

  /**
   * Helper unificado que tenta chamar o servidor Express (/api/...), mas se estiver
   * em ambiente estático (como Vercel sem serverless ou offline), recorre transparentemente
   * ao banco local em localStorage com todos os dados oficiais do IPME.
   */
  private async request<T>(
    url: string,
    options: RequestInit | undefined,
    fallbackFn: () => T | Promise<T>
  ): Promise<T> {
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options?.headers || {}),
        },
      });

      const contentType = res.headers.get('content-type') || '';
      // Quando Vercel hospeda estático e recebe /api/*, costuma retornar text/html (index.html)
      if (!contentType.includes('application/json')) {
        return await fallbackFn();
      }

      if (!res.ok) {
        if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504) {
          return await fallbackFn();
        }
        const errJson = await res.json().catch(() => null);
        if (res.status >= 400 && res.status < 500) {
          const businessErr: any = new Error(errJson?.message || `Erro no servidor IPME (${res.status})`);
          businessErr.isBusinessError = true;
          if (errJson && typeof errJson === 'object') {
            Object.assign(businessErr, errJson);
          }
          throw businessErr;
        }
        return await fallbackFn();
      }

      const json = await res.json();
      if (!json.success) {
        const businessErr = new Error(json.message || 'Falha na resposta do servidor.');
        (businessErr as any).isBusinessError = true;
        throw businessErr;
      }
      return json.data;
    } catch (err: any) {
      // Se for regra de negócio explícita do backend (validação de formulário/concessão), propagamos
      if (err?.isBusinessError) {
        throw err;
      }
      // Em falha de rede/timeout/Vercel estático, utiliza a base de contingência local
      return await fallbackFn();
    }
  }

  // --- Dashboard Stats & Metrics ---
  public async getStats(): Promise<DashboardMetrics> {
    return this.request(
      '/api/stats',
      { method: 'GET' },
      () => clientDb.getMetrics()
    );
  }

  // --- Employees ---
  public async getEmployees(search?: string, secretaria?: string, status?: string): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (secretaria) params.append('secretaria', secretaria);
    if (status) params.append('status', status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(
      `/api/employees${query}`,
      { method: 'GET' },
      () => clientDb.getEmployees(search, secretaria, status)
    );
  }

  public async getEmployee(matricula: string): Promise<Employee & { history: Occurrence[] }> {
    return this.request(
      `/api/employees/${matricula}`,
      { method: 'GET' },
      () => {
        const emp = clientDb.getEmployeeByMatricula(matricula);
        if (!emp) throw new Error('Servidor não encontrado.');
        const history = clientDb.getOccurrences(emp.matricula);
        return { ...emp, history };
      }
    );
  }

  public async getEmployeeByMatricula(matricula: string): Promise<Employee & { history?: Occurrence[] }> {
    return this.getEmployee(matricula);
  }

  public async createEmployee(emp: Partial<Employee>): Promise<Employee> {
    return this.request(
      '/api/employees',
      {
        method: 'POST',
        body: JSON.stringify({ ...emp, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveEmployee(emp, this.actorEmail, this.actorRole)
    );
  }

  public async updateEmployee(matricula: string, emp: Partial<Employee>): Promise<Employee> {
    return this.request(
      `/api/employees/${matricula}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...emp, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveEmployee({ ...emp, matricula }, this.actorEmail, this.actorRole)
    );
  }

  public async deleteEmployee(matricula: string): Promise<boolean> {
    return this.request(
      `/api/employees/${matricula}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.deleteEmployee(matricula, this.actorEmail, this.actorRole)
    );
  }

  // --- Occurrences ---
  public async getOccurrences(matricula?: string, tipo?: string, status?: string, dataInicio?: string, dataTermino?: string): Promise<Occurrence[]> {
    const params = new URLSearchParams();
    if (matricula) params.append('matricula', matricula);
    if (tipo) params.append('tipo', tipo);
    if (status) params.append('status', status);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataTermino) params.append('dataTermino', dataTermino);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(
      `/api/occurrences${query}`,
      { method: 'GET' },
      () => clientDb.getOccurrences(matricula, tipo, status, dataInicio, dataTermino)
    );
  }

  public async getOccurrence(id: string): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}`,
      { method: 'GET' },
      () => {
        const occ = clientDb.getOccurrenceById(id);
        if (!occ) throw new Error('Ocorrência não encontrada.');
        return occ;
      }
    );
  }

  public async createOccurrence(occ: Partial<Occurrence>): Promise<Occurrence> {
    return this.request(
      '/api/occurrences',
      {
        method: 'POST',
        body: JSON.stringify({ ...occ, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveOccurrence(occ, this.actorEmail, this.actorRole)
    );
  }

  public async updateOccurrence(id: string, occ: Partial<Occurrence>): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...occ, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveOccurrence({ ...occ, id }, this.actorEmail, this.actorRole)
    );
  }

  public async prorrogarOccurrence(
    id: string,
    data: { novaDataTermino: string; motivo: string; medico?: string; crm?: string }
  ): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}/prorrogar`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.prorrogarOccurrence(id, data, this.actorEmail, this.actorRole)
    );
  }

  public async concluirOccurrence(
    id: string,
    parecerFinal: string,
    dataConcessao?: string,
    atoConcessao?: string
  ): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}/concluir`,
      {
        method: 'POST',
        body: JSON.stringify({
          parecerFinal,
          dataConcessao,
          atoConcessao,
          actorEmail: this.actorEmail,
          actorRole: this.actorRole,
        }),
      },
      () => clientDb.concluirOccurrence(id, parecerFinal, this.actorEmail, this.actorRole, dataConcessao, atoConcessao)
    );
  }

  public async retornarTrabalhoOccurrence(
    id: string,
    data: { dataRetorno: string; motivoRetorno: string; medico?: string; crm?: string; atoReversao?: string }
  ): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}/retorno-trabalho`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.retornarTrabalhoOccurrence(id, data, this.actorEmail, this.actorRole)
    );
  }

  public async converterOccurrenceDefinitiva(
    id: string,
    data: { dataConcessao: string; atoConcessao?: string; motivo?: string; medico?: string; crm?: string; parecerTecnico?: string }
  ): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}/converter-definitiva`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.converterOccurrenceDefinitiva(id, data, this.actorEmail, this.actorRole)
    );
  }

  public async cancelarOccurrence(id: string, motivo: string): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}/cancelar`,
      {
        method: 'POST',
        body: JSON.stringify({ motivo, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.cancelarOccurrence(id, motivo, this.actorEmail, this.actorRole)
    );
  }

  public async deleteOccurrence(id: string): Promise<boolean> {
    return this.request(
      `/api/occurrences/${id}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.deleteOccurrence(id, this.actorEmail, this.actorRole)
    );
  }

  public async clearOccurrences(): Promise<{ deletedOccurrences: number }> {
    return this.request(
      '/api/admin/clear-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.clearOccurrences(this.actorEmail, this.actorRole)
    );
  }

  // --- Secretarias ---
  public async getSecretarias(): Promise<Secretaria[]> {
    return this.request(
      '/api/secretarias',
      { method: 'GET' },
      () => clientDb.getSecretarias()
    );
  }

  public async createSecretaria(sec: Partial<Secretaria>): Promise<Secretaria> {
    return this.request(
      '/api/secretarias',
      {
        method: 'POST',
        body: JSON.stringify({ ...sec, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveSecretaria(sec, this.actorEmail, this.actorRole)
    );
  }

  public async updateSecretaria(id: string, sec: Partial<Secretaria>): Promise<Secretaria> {
    return this.request(
      `/api/secretarias/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...sec, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveSecretaria({ ...sec, id }, this.actorEmail, this.actorRole)
    );
  }

  public async deleteSecretaria(id: string): Promise<boolean> {
    return this.request(
      `/api/secretarias/${id}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.deleteSecretaria(id, this.actorEmail, this.actorRole)
    );
  }

  // --- Doctors ---
  public async getDoctors(): Promise<Doctor[]> {
    return this.request(
      '/api/doctors',
      { method: 'GET' },
      () => clientDb.getDoctors()
    );
  }

  public async createDoctor(doc: Partial<Doctor>): Promise<Doctor> {
    return this.request(
      '/api/doctors',
      {
        method: 'POST',
        body: JSON.stringify({ ...doc, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveDoctor(doc, this.actorEmail, this.actorRole)
    );
  }

  public async updateDoctor(idOrCrm: string, doc: Partial<Doctor>): Promise<Doctor> {
    return this.request(
      `/api/doctors/${encodeURIComponent(idOrCrm)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...doc, actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.saveDoctor({ ...doc, id: doc.id || idOrCrm }, this.actorEmail, this.actorRole)
    );
  }

  public async deleteDoctor(idOrCrm: string): Promise<boolean> {
    return this.request(
      `/api/doctors/${encodeURIComponent(idOrCrm)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.deleteDoctor(idOrCrm, this.actorEmail, this.actorRole)
    );
  }

  public async toggleDoctorStatus(idOrCrm: string): Promise<Doctor> {
    return this.request(
      `/api/doctors/${encodeURIComponent(idOrCrm)}/toggle`,
      {
        method: 'PATCH',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.toggleDoctorStatus(idOrCrm, this.actorEmail, this.actorRole)
    );
  }

  public async setDoctorDiretor(idOrCrm: string): Promise<Doctor> {
    return this.request(
      `/api/doctors/${encodeURIComponent(idOrCrm)}/set-diretor`,
      {
        method: 'PATCH',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => clientDb.setDoctorDiretor(idOrCrm, this.actorEmail, this.actorRole)
    );
  }

  // --- Audit Trail ---
  public async getAuditLogs(entityType?: string, entityId?: string, action?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);
    if (action) params.append('action', action);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(
      `/api/audit-logs${query}`,
      { method: 'GET' },
      () => clientDb.getAuditLogs(entityType, entityId, action)
    );
  }

  // --- Users ---
  public async getUsers(): Promise<AppUser[]> {
    const users = await this.request(
      '/api/users',
      { method: 'GET' },
      () => clientDb.getUsers()
    );
    if (Array.isArray(users)) {
      clientDb.syncUsers(users);
    }
    return users;
  }

  public async createUser(user: Partial<AppUser>): Promise<AppUser> {
    const actorEmail = this.currentUser?.email || 'Pliniocatunda@gmail.com';
    const actorRole = this.currentUser?.role || 'admin';
    const created = await this.request(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify({ ...user, actorEmail, actorRole }),
      },
      () => clientDb.saveUser(user, actorEmail, actorRole)
    );
    if (created) {
      clientDb.upsertUser(created);
    }
    return created;
  }

  public async saveUser(user: Partial<AppUser>): Promise<AppUser> {
    return this.createUser(user);
  }

  public async updateUser(email: string, user: Partial<AppUser>): Promise<AppUser> {
    const actorEmail = this.currentUser?.email || 'Pliniocatunda@gmail.com';
    const actorRole = this.currentUser?.role || 'admin';
    const updated = await this.request(
      `/api/users/${email}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...user, actorEmail, actorRole }),
      },
      () => clientDb.saveUser({ ...user, email }, actorEmail, actorRole)
    );
    if (updated) {
      clientDb.upsertUser(updated);
    }
    return updated;
  }

  public async deleteUser(email: string): Promise<boolean> {
    const actorEmail = this.currentUser?.email || 'Pliniocatunda@gmail.com';
    const actorRole = this.currentUser?.role || 'admin';
    return this.request(
      `/api/users/${email}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail, actorRole }),
      },
      () => clientDb.deleteUser(email, actorEmail, actorRole)
    );
  }

  public async login(email: string, name?: string, provider: 'google' | 'corporate' = 'corporate', password?: string): Promise<AppUser> {
    const user = await this.request(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, name, provider, password }),
      },
      () => clientDb.login(email, name, provider, password)
    );
    if (user) {
      clientDb.upsertUser(user);
    }
    this.setCurrentUser(user);
    return user;
  }

  public async confirmEmail(email: string, codeOrToken: string): Promise<AppUser> {
    const actorEmail = this.currentUser?.email || 'Sistema IPME';
    const user = await this.request(
      '/api/auth/confirm-email',
      {
        method: 'POST',
        body: JSON.stringify({ email, code: codeOrToken, actorEmail }),
      },
      () => clientDb.confirmEmail(email, codeOrToken, actorEmail)
    );
    if (user) {
      clientDb.upsertUser(user);
    }
    return user;
  }

  public async resendConfirmationEmail(email: string): Promise<{ success: boolean; code: string; token: string; email: string; name: string }> {
    const actorEmail = this.currentUser?.email || 'Sistema IPME';
    return this.request(
      '/api/auth/resend-confirmation',
      {
        method: 'POST',
        body: JSON.stringify({ email, actorEmail }),
      },
      () => clientDb.resendConfirmationEmail(email, actorEmail)
    );
  }

  public async changePassword(email: string, currentPass: string, newPass: string): Promise<AppUser> {
    const actorEmail = this.currentUser?.email || email;
    const user = await this.request(
      '/api/auth/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ email, currentPassword: currentPass, newPassword: newPass, actorEmail }),
      },
      () => clientDb.changePassword(email, currentPass, newPass, actorEmail)
    );
    if (user) {
      clientDb.upsertUser(user);
    }
    if (this.currentUser && this.currentUser.email.toLowerCase() === email.toLowerCase()) {
      this.setCurrentUser(user);
    }
    return user;
  }

  public async importCadastroCSV(
    csvText: string,
    substituirExistentes: boolean
  ): Promise<{
    totalLinhas: number;
    servidoresImportados: number;
    servidoresAtualizados: number;
    secretariasImportadas: number;
    secretariasAtualizadas: number;
    telefonesFormatados: number;
    telefonesIgnorados: number;
    erros: string[];
  }> {
    return this.request(
      '/api/admin/import-csv',
      {
        method: 'POST',
        body: JSON.stringify({
          csvText,
          substituirExistentes,
          actorEmail: this.actorEmail,
          actorRole: this.actorRole,
        }),
      },
      () => clientDb.importCadastroCSV(csvText, substituirExistentes, this.actorEmail, this.actorRole)
    );
  }

  // --- Tenants & Environment APIs ---
  public async getTenants(): Promise<TenantInfo[]> {
    return this.request(
      '/api/tenants',
      { method: 'GET' },
      async () => {
        const defaultTenants: TenantInfo[] = [
          {
            id: 'ipme_eusebio',
            nome: 'IPME - Instituto de Previdência do Município de Eusébio',
            sigla: 'IPME Eusébio',
            cnpj: '05.123.456/0001-78',
            cidade: 'Eusébio',
            uf: 'CE',
            ambiente: 'producao',
            ativo: true,
            created_at: '2026-01-01T08:00:00.000Z',
            descricao: 'Base Oficial de Produção Previdenciária do Município de Eusébio - CE. Isolada e auditada.',
          },
          {
            id: 'studio_sandbox',
            nome: 'Ambiente de Testes & Homologação Studio',
            sigla: 'Studio Sandbox',
            cnpj: '00.000.000/0001-00',
            cidade: 'Eusébio (Ambiente de Testes)',
            uf: 'CE',
            ambiente: 'homologacao',
            ativo: true,
            created_at: '2026-01-01T08:00:00.000Z',
            descricao: 'Ambiente seguro para testes no Google AI Studio. Os testes aqui realizados NUNCA afetam a base oficial do cliente.',
          },
        ];

        let customTenants: TenantInfo[] = [];
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('ipme_custom_tenants');
            if (raw) {
              customTenants = JSON.parse(raw);
            }
          } catch {}
        }

        try {
          const remoteTenants = await firestoreService.getTenants();
          if (remoteTenants && remoteTenants.length > 0) {
            for (const rt of remoteTenants) {
              if (!customTenants.some(ct => ct.id === rt.id) && rt.id !== 'ipme_eusebio' && rt.id !== 'studio_sandbox') {
                customTenants.push(rt);
              }
            }
          }
        } catch {}

        const all = [...defaultTenants];
        for (const ct of customTenants) {
          if (!all.some(t => t.id === ct.id)) {
            all.push(ct);
          }
        }
        return all;
      }
    );
  }

  public async getCurrentTenant(): Promise<TenantInfo> {
    return this.request(
      '/api/tenants/current',
      { method: 'GET' },
      async () => {
        const list = await this.getTenants();
        return list.find(t => t.id === this.getActiveTenantId()) || list[0];
      }
    );
  }

  public async saveTenant(tenant: Partial<TenantInfo> & { nome: string; sigla: string }): Promise<TenantInfo> {
    const rawId = tenant.id || tenant.sigla.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const id = rawId.startsWith('tenant_') ? rawId : `tenant_${rawId}`;

    return this.request(
      '/api/tenants',
      {
        method: 'POST',
        body: JSON.stringify(tenant),
      },
      async () => {
        const created: TenantInfo = {
          id: id,
          nome: tenant.nome.trim(),
          sigla: tenant.sigla.trim().toUpperCase(),
          cnpj: tenant.cnpj?.trim() || '00.000.000/0001-00',
          cidade: tenant.cidade?.trim() || 'Município',
          uf: tenant.uf?.trim().toUpperCase() || 'CE',
          ambiente: tenant.ambiente || 'producao',
          ativo: tenant.ativo !== undefined ? tenant.ativo : true,
          created_at: new Date().toISOString(),
          descricao: tenant.descricao?.trim() || `Instância de banco de dados isolada para ${tenant.nome}.`,
        };

        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('ipme_custom_tenants');
            const list: TenantInfo[] = raw ? JSON.parse(raw) : [];
            const idx = list.findIndex(t => t.id === created.id);
            if (idx >= 0) {
              list[idx] = created;
            } else {
              list.push(created);
            }
            localStorage.setItem('ipme_custom_tenants', JSON.stringify(list));

            // Inicializa seed limpo para a nova partição se não existir
            const storageKey = `ipme_browser_db_tenant_${created.id}`;
            if (!localStorage.getItem(storageKey)) {
              const freshSeed = {
                employees: [],
                occurrences: [],
                secretarias: [],
                doctors: [],
                users: [
                  {
                    id: 'admin_tenant',
                    email: this.actorEmail || 'admin@instituto.gov.br',
                    name: 'Administrador Local',
                    role: 'admin',
                    ativo: true,
                    is_presidente: true,
                    is_medico_perito: false,
                    cargo: 'Gestor Previdenciário',
                    departamento: created.nome,
                    created_at: new Date().toISOString(),
                  }
                ],
                audit_logs: [
                  {
                    id: `audit_init_${Date.now()}`,
                    entity_type: 'user',
                    entity_id: created.id,
                    action: 'CREATE',
                    details: `Partição de banco de dados para ${created.nome} criada com isolamento total.`,
                    changed_by: this.actorEmail || 'Sistema',
                    user_role: 'admin',
                    timestamp: new Date().toISOString(),
                  }
                ],
              };
              localStorage.setItem(storageKey, JSON.stringify(freshSeed));
            }
          } catch (e) {
            console.error('Erro ao salvar tenant localmente:', e);
          }
        }

        try {
          await firestoreService.saveTenant(created);
        } catch {}

        return created;
      }
    );
  }

  public async resetSandbox(): Promise<boolean> {
    return this.request(
      '/api/tenants/reset-sandbox',
      {
        method: 'POST',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => {
        clientDb.resetSandbox();
        return true;
      }
    );
  }

  public async resetEusebioOfficial(): Promise<boolean> {
    return this.request(
      '/api/tenants/reset-eusebio',
      {
        method: 'POST',
        body: JSON.stringify({ actorEmail: this.actorEmail, actorRole: this.actorRole }),
      },
      () => {
        clientDb.resetEusebioOfficial();
        return true;
      }
    );
  }
}

export const api = new ApiService();

