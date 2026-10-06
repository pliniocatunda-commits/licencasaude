import { Employee, Occurrence, AuditLog, AppUser, DashboardMetrics, Secretaria, Doctor } from '../types/index.ts';
import { clientDb } from './localDatabase.ts';

class ApiService {
  private currentUser: AppUser = {
    id: 'user_master_admin',
    email: 'Pliniocatunda@gmail.com',
    name: 'Plínio Catunda',
    role: 'admin',
    auth_provider: 'google',
    department: 'IPME - Presidência & Governança',
    avatar_url: '/src/assets/images/ipme_seal_logo_1790337165041.jpg',
    created_at: '2026-01-01T08:00:00.000Z',
  };

  public getCurrentUser(): AppUser {
    return this.currentUser;
  }

  public setCurrentUser(user: AppUser) {
    this.currentUser = user;
    try {
      localStorage.setItem('ipme_current_user', JSON.stringify(user));
    } catch {}
  }

  public initUser() {
    try {
      const stored = localStorage.getItem('ipme_current_user');
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {}
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-email': this.currentUser.email,
      'x-user-role': this.currentUser.role,
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
        if (res.status === 400 || res.status === 422 || res.status === 403) {
          const businessErr = new Error(errJson?.message || `Erro no servidor IPME (${res.status})`);
          (businessErr as any).isBusinessError = true;
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
        body: JSON.stringify({ ...emp, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveEmployee(emp, this.currentUser.email, this.currentUser.role)
    );
  }

  public async updateEmployee(matricula: string, emp: Partial<Employee>): Promise<Employee> {
    return this.request(
      `/api/employees/${matricula}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...emp, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveEmployee({ ...emp, matricula }, this.currentUser.email, this.currentUser.role)
    );
  }

  public async deleteEmployee(matricula: string): Promise<boolean> {
    return this.request(
      `/api/employees/${matricula}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.deleteEmployee(matricula, this.currentUser.email, this.currentUser.role)
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
        body: JSON.stringify({ ...occ, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveOccurrence(occ, this.currentUser.email, this.currentUser.role)
    );
  }

  public async updateOccurrence(id: string, occ: Partial<Occurrence>): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...occ, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveOccurrence({ ...occ, id }, this.currentUser.email, this.currentUser.role)
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
        body: JSON.stringify({ ...data, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.prorrogarOccurrence(id, data, this.currentUser.email, this.currentUser.role)
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
          actorEmail: this.currentUser.email,
          actorRole: this.currentUser.role,
        }),
      },
      () => clientDb.concluirOccurrence(id, parecerFinal, this.currentUser.email, this.currentUser.role, dataConcessao, atoConcessao)
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
        body: JSON.stringify({ ...data, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.retornarTrabalhoOccurrence(id, data, this.currentUser.email, this.currentUser.role)
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
        body: JSON.stringify({ ...data, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.converterOccurrenceDefinitiva(id, data, this.currentUser.email, this.currentUser.role)
    );
  }

  public async cancelarOccurrence(id: string, motivo: string): Promise<Occurrence> {
    return this.request(
      `/api/occurrences/${id}/cancelar`,
      {
        method: 'POST',
        body: JSON.stringify({ motivo, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.cancelarOccurrence(id, motivo, this.currentUser.email, this.currentUser.role)
    );
  }

  public async deleteOccurrence(id: string): Promise<boolean> {
    return this.request(
      `/api/occurrences/${id}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.deleteOccurrence(id, this.currentUser.email, this.currentUser.role)
    );
  }

  public async clearOccurrences(): Promise<{ deletedOccurrences: number }> {
    return this.request(
      '/api/admin/clear-occurrences',
      {
        method: 'POST',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.clearOccurrences(this.currentUser.email, this.currentUser.role)
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
        body: JSON.stringify({ ...sec, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveSecretaria(sec, this.currentUser.email, this.currentUser.role)
    );
  }

  public async updateSecretaria(id: string, sec: Partial<Secretaria>): Promise<Secretaria> {
    return this.request(
      `/api/secretarias/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...sec, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveSecretaria({ ...sec, id }, this.currentUser.email, this.currentUser.role)
    );
  }

  public async deleteSecretaria(id: string): Promise<boolean> {
    return this.request(
      `/api/secretarias/${id}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.deleteSecretaria(id, this.currentUser.email, this.currentUser.role)
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
        body: JSON.stringify({ ...doc, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveDoctor(doc, this.currentUser.email, this.currentUser.role)
    );
  }

  public async updateDoctor(crm: string, doc: Partial<Doctor>): Promise<Doctor> {
    return this.request(
      `/api/doctors/${crm}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...doc, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveDoctor({ ...doc, crm }, this.currentUser.email, this.currentUser.role)
    );
  }

  public async deleteDoctor(crm: string): Promise<boolean> {
    return this.request(
      `/api/doctors/${crm}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.deleteDoctor(crm, this.currentUser.email, this.currentUser.role)
    );
  }

  public async toggleDoctorStatus(id: string): Promise<Doctor> {
    return this.request(
      `/api/doctors/${id}/toggle`,
      {
        method: 'PATCH',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.toggleDoctorStatus(id, this.currentUser.email, this.currentUser.role)
    );
  }

  public async setDoctorDiretor(id: string): Promise<Doctor> {
    return this.request(
      `/api/doctors/${id}/set-diretor`,
      {
        method: 'PATCH',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.setDoctorDiretor(id, this.currentUser.email, this.currentUser.role)
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
    return this.request(
      '/api/users',
      { method: 'GET' },
      () => clientDb.getUsers()
    );
  }

  public async createUser(user: Partial<AppUser>): Promise<AppUser> {
    return this.request(
      '/api/users',
      {
        method: 'POST',
        body: JSON.stringify({ ...user, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveUser(user, this.currentUser.email, this.currentUser.role)
    );
  }

  public async saveUser(user: Partial<AppUser>): Promise<AppUser> {
    return this.createUser(user);
  }

  public async updateUser(email: string, user: Partial<AppUser>): Promise<AppUser> {
    return this.request(
      `/api/users/${email}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...user, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.saveUser({ ...user, email }, this.currentUser.email, this.currentUser.role)
    );
  }

  public async deleteUser(email: string): Promise<boolean> {
    return this.request(
      `/api/users/${email}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
      },
      () => clientDb.deleteUser(email, this.currentUser.email, this.currentUser.role)
    );
  }

  public async login(email: string, name?: string, provider: 'google' | 'corporate' = 'corporate'): Promise<AppUser> {
    return this.request(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, name, provider }),
      },
      () => clientDb.login(email, name, provider)
    );
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
          actorEmail: this.currentUser.email,
          actorRole: this.currentUser.role,
        }),
      },
      () => clientDb.importCadastroCSV(csvText, substituirExistentes, this.currentUser.email, this.currentUser.role)
    );
  }
}

export const api = new ApiService();
