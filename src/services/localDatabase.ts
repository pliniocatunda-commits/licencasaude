import { Employee, Occurrence, Secretaria, Doctor, AuditLog, AppUser, DashboardMetrics } from '../types/index.ts';
import { calcularDiasPagos, normalizeSecretaria, formatarMatricula, limparCaracteres, formatarCPF } from '../utils/validation.ts';
import { parseServidoresCSV } from '../utils/csvImporter.ts';
import eusebioOfficialData from '../data/tenants/ipme_eusebio.json';
import sandboxOfficialData from '../data/tenants/studio_sandbox.json';


export interface DatabaseSchema {
  employees: Employee[];
  occurrences: Occurrence[];
  secretarias: Secretaria[];
  doctors: Doctor[];
  users: AppUser[];
  audit_logs: AuditLog[];
}

export const DEFAULT_IPME_USERS: AppUser[] = [
  {
    id: 'user_master_plinio',
    email: 'pliniocatunda@gmail.com',
    name: 'Plínio Catunda (Administrador Master)',
    role: 'admin',
    auth_provider: 'google',
    department: 'IPME - Presidência & Governança',
    cargo: 'Administrador Master do Sistema',
    funcao_pericial: 'Administrador Master da Governança Previdenciária',
    ativo: true,
    email_verified: true,
    is_master_admin: true,
    is_presidente: false,
    avatar_url: '/src/assets/images/ipme_logo_correto_1792419543135.jpg',
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user_oper_plinio_camara',
    email: 'plinio.camara@ipmeusebio.ce.gov.br',
    name: 'Plinio Bezerra Camara Campos',
    role: 'operator',
    auth_provider: 'corporate',
    department: 'IPME - Presidência do Instituto',
    cargo: 'Presidente do IPME',
    funcao_pericial: 'Presidente do IPME',
    ativo: true,
    email_verified: true,
    password: 'Ipme@2026',
    is_presidente: true,
    tenant_id: 'ipme_eusebio',
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user_oper_luiz_plinio',
    email: 'plinio.catunda@ipmeusebio.ce.gov.br',
    name: 'Luiz Plinio',
    role: 'operator',
    auth_provider: 'corporate',
    department: 'IPME - Junta Médica Pericial',
    cargo: 'Assistente operacional',
    funcao_pericial: 'Assistente Operacional da Junta Médica',
    ativo: true,
    email_verified: true,
    password: 'Ipme@2026',
    is_presidente: false,
    tenant_id: 'ipme_eusebio',
    created_at: '2026-01-01T08:00:00.000Z',
  },
];

export const DEFAULT_SANDBOX_USERS: AppUser[] = [
  {
    id: 'user_master_plinio_sbx',
    email: 'pliniocatunda@gmail.com',
    name: 'Plínio Catunda (Administrador Master)',
    role: 'admin',
    auth_provider: 'google',
    department: 'Studio Sandbox - Governança',
    cargo: 'Administrador Master do Sistema',
    funcao_pericial: 'Administrador Master da Governança Previdenciária',
    ativo: true,
    email_verified: true,
    is_master_admin: true,
    is_presidente: true,
    avatar_url: '/src/assets/images/ipme_logo_correto_1792419543135.jpg',
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user_perito_medico',
    email: 'medico.perito@eusebio.ce.gov.br',
    name: 'Dr. Marcelo Cavalcante Holanda',
    role: 'operator',
    auth_provider: 'corporate',
    department: 'Studio Sandbox - Junta Médica',
    cargo: 'Médico Perito Oficial',
    funcao_pericial: 'Coordenador da Junta Médica Pericial Oficial',
    ativo: true,
    email_verified: true,
    password: 'Perito@2026',
    is_presidente: false,
    tenant_id: 'studio_sandbox',
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user_rh_operador',
    email: 'rh.operador@eusebio.ce.gov.br',
    name: 'Mariana Vasconcelos de Albuquerque',
    role: 'operator',
    auth_provider: 'corporate',
    department: 'Studio Sandbox - Recursos Humanos',
    cargo: 'Analista de Recursos Humanos',
    funcao_pericial: 'Coordenação de Gestão de Pessoas',
    ativo: true,
    email_verified: true,
    password: 'RhOperador@2026',
    is_presidente: false,
    tenant_id: 'studio_sandbox',
    created_at: '2026-01-01T08:00:00.000Z',
  },
];

const INITIAL_DATA: DatabaseSchema = eusebioOfficialData as unknown as DatabaseSchema;
const SANDBOX_INITIAL_DATA: DatabaseSchema = sandboxOfficialData as unknown as DatabaseSchema;

export class ClientDatabase {
  private activeTenantId: string = typeof window !== 'undefined'
    ? (localStorage.getItem('ipme_active_tenant_id') || (window.location.hostname.includes('ais-dev') ? 'studio_sandbox' : 'ipme_eusebio'))
    : 'ipme_eusebio';

  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  public setActiveTenant(tenantId: string) {
    this.activeTenantId = tenantId || 'ipme_eusebio';
    this.data = this.loadFromStorage();
  }

  public getActiveTenant(): string {
    return this.activeTenantId;
  }

  public resetSandbox(): void {
    const seed = JSON.parse(JSON.stringify(SANDBOX_INITIAL_DATA)) as DatabaseSchema;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ipme_browser_db_tenant_studio_sandbox', JSON.stringify(seed));
      } catch {}
    }
    if (this.activeTenantId === 'studio_sandbox') {
      this.data = seed;
    }
  }

  public resetEusebioOfficial(): void {
    const seed = JSON.parse(JSON.stringify(INITIAL_DATA)) as DatabaseSchema;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ipme_browser_db_tenant_ipme_eusebio', JSON.stringify(seed));
      } catch {}
    }
    if (this.activeTenantId === 'ipme_eusebio') {
      this.data = seed;
    }
  }

  public ensureFullEmployeesLoaded(): void {
    if (this.activeTenantId === 'ipme_eusebio') {
      if (!this.data.employees || this.data.employees.length < 1000) {
        console.info(`[IPME] Restaurando catálogo oficial completo de ${INITIAL_DATA.employees.length} servidores de Eusébio.`);
        const map = new Map<string, Employee>();
        (INITIAL_DATA.employees || []).forEach(e => map.set(e.matricula.trim(), e));
        (this.data.employees || []).forEach(e => map.set(e.matricula.trim(), e));
        this.data.employees = Array.from(map.values());
        this.saveToStorage(this.data);
      }
    }
  }

  public getFullData(): DatabaseSchema {
    this.ensureFullEmployeesLoaded();
    return JSON.parse(JSON.stringify(this.data));
  }

  public syncFromCloud(emps?: Employee[], occs?: Occurrence[], docs?: Doctor[], secs?: Secretaria[], usrs?: AppUser[]) {
    let changed = false;
    if (emps && emps.length > 0) {
      if (this.activeTenantId === 'ipme_eusebio') {
        // Se a nuvem tiver menos de 1.000 servidores, nunca descarta o catálogo de 1.527 servidores de Eusébio!
        const map = new Map<string, Employee>();
        if (this.data.employees && this.data.employees.length >= 1000) {
          this.data.employees.forEach(e => map.set(e.matricula.trim(), e));
        } else {
          (INITIAL_DATA.employees || []).forEach(e => map.set(e.matricula.trim(), e));
          (this.data.employees || []).forEach(e => map.set(e.matricula.trim(), e));
        }
        emps.forEach(e => map.set(e.matricula.trim(), e));
        this.data.employees = Array.from(map.values());
      } else {
        this.data.employees = emps;
      }
      changed = true;
    }
    if (occs && occs.length > 0) {
      this.data.occurrences = occs;
      changed = true;
    }
    if (docs && docs.length > 0) {
      this.data.doctors = docs;
      changed = true;
    }
    if (secs && secs.length > 0) {
      this.data.secretarias = secs;
      changed = true;
    }
    if (usrs && usrs.length > 0) {
      if (!this.data.users) this.data.users = [];
      const userMap = new Map<string, AppUser>();
      this.data.users.forEach(u => {
        if (u.email) userMap.set(u.email.toLowerCase().trim(), u);
      });
      usrs.forEach(u => {
        if (u.email) {
          const key = u.email.toLowerCase().trim();
          const existing = userMap.get(key);
          userMap.set(key, { ...existing, ...u });
        }
      });
      this.data.users = Array.from(userMap.values());
      changed = true;
    }
    if (changed) {
      this.saveToStorage(this.data);
    }
  }

  public downloadBackupFile(): void {
    if (typeof window === 'undefined') return;
    const jsonStr = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    const occCount = this.data.occurrences?.length || 0;
    const empCount = this.data.employees?.length || 0;
    a.href = url;
    a.download = `backup_ipme_${this.activeTenantId}_${dateStr}_${empCount}serv_${occCount}licencas.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  public importFullData(imported: DatabaseSchema): { success: boolean; employees: number; occurrences: number } {
    if (!imported || !Array.isArray(imported.employees) || !Array.isArray(imported.occurrences)) {
      throw new Error('Arquivo de backup inválido: não contém a estrutura de servidores e ocorrências.');
    }
    this.data = {
      employees: imported.employees,
      occurrences: imported.occurrences,
      doctors: imported.doctors || this.data.doctors || [],
      secretarias: imported.secretarias || this.data.secretarias || [],
      users: imported.users || this.data.users || [],
      audit_logs: imported.audit_logs || this.data.audit_logs || [],
    };
    this.saveToStorage(this.data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ipme_data_updated', { detail: { tenantId: this.activeTenantId } }));
    }
    return {
      success: true,
      employees: this.data.employees.length,
      occurrences: this.data.occurrences.length,
    };
  }

  private getStorageKey(): string {
    return `ipme_browser_db_tenant_${this.activeTenantId}`;
  }

  private loadFromStorage(): DatabaseSchema {
    if (typeof window === 'undefined') {
      return this.activeTenantId === 'studio_sandbox'
        ? (JSON.parse(JSON.stringify(SANDBOX_INITIAL_DATA)) as DatabaseSchema)
        : (JSON.parse(JSON.stringify(INITIAL_DATA)) as DatabaseSchema);
    }
    try {
      let stored = localStorage.getItem(this.getStorageKey());
      // Migração de chave legada se for ipme_eusebio
      if (!stored && this.activeTenantId === 'ipme_eusebio') {
        stored = localStorage.getItem('ipme_browser_db_v2');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.employees && parsed.occurrences) {
          // SE estiver em Produção Oficial (ipme_eusebio) e o cache contiver menos de 1.000 servidores,
          // restaura de imediato o catálogo completo oficial de 1.527 servidores de Eusébio!
          if (this.activeTenantId === 'ipme_eusebio' && parsed.employees.length < 1000) {
            console.info(`[IPME] Detectado cache com apenas ${parsed.employees.length} servidores. Restaurando os ${INITIAL_DATA.employees.length} servidores oficiais.`);
            const full = JSON.parse(JSON.stringify(INITIAL_DATA)) as DatabaseSchema;
            if (parsed.occurrences && parsed.occurrences.length > 0) {
              full.occurrences = parsed.occurrences;
            }
            const empMap = new Map<string, Employee>();
            full.employees.forEach(e => empMap.set(e.matricula.trim(), e));
            (parsed.employees || []).forEach((e: Employee) => empMap.set(e.matricula.trim(), e));
            full.employees = Array.from(empMap.values());
            if (parsed.doctors && parsed.doctors.length > 0) full.doctors = parsed.doctors;
            if (parsed.secretarias && parsed.secretarias.length > 0) full.secretarias = parsed.secretarias;
            if (parsed.users && parsed.users.length > 0) full.users = parsed.users;
            this.saveToStorage(full);
            return full;
          }

          // Sanitização de secretarias corrompidas com CPF
          if (parsed.secretarias && Array.isArray(parsed.secretarias)) {
            parsed.secretarias = parsed.secretarias.filter((s: Secretaria) => 
              !/SEC-\d{3}\.\d{3}\.\d{3}-\d{2}/.test(s.id) &&
              !/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(s.sigla) &&
              !/^\d{3}$/.test(s.nome)
            );
          }

          if (!parsed.users || !Array.isArray(parsed.users)) {
            parsed.users = [];
          }

          if (this.activeTenantId === 'ipme_eusebio') {
            const userMap = new Map<string, AppUser>();
            parsed.users.forEach((u: AppUser) => {
              if (u && u.email) userMap.set(u.email.toLowerCase().trim(), u);
            });
            DEFAULT_IPME_USERS.forEach(defU => {
              const key = defU.email.toLowerCase().trim();
              if (!userMap.has(key)) {
                userMap.set(key, { ...defU });
              } else {
                const cur = userMap.get(key)!;
                if (key === 'plinio.camara@ipmeusebio.ce.gov.br') {
                  cur.cargo = 'Presidente do IPME';
                  cur.funcao_pericial = 'Presidente do IPME';
                  cur.is_presidente = true;
                  cur.ativo = true;
                }
                if (!cur.password && defU.password) cur.password = defU.password;
                if (cur.ativo === undefined) cur.ativo = true;
              }
            });
            parsed.users = Array.from(userMap.values());
          } else {
            // Em ambientes de outros clientes / sandbox, remove operadores exclusivos do IPME Eusébio que possam ter vazado
            parsed.users = parsed.users.filter((u: AppUser) => 
              u.email?.toLowerCase().trim() !== 'plinio.camara@ipmeusebio.ce.gov.br' &&
              u.email?.toLowerCase().trim() !== 'plinio.catunda@ipmeusebio.ce.gov.br'
            );

            // Garante o Administrador Master em qualquer tenant
            if (!parsed.users.some((u: AppUser) => u.email?.toLowerCase().trim() === 'pliniocatunda@gmail.com')) {
              parsed.users.unshift({
                id: `user_master_${this.activeTenantId}`,
                email: 'pliniocatunda@gmail.com',
                name: 'Plínio Catunda (Administrador Master)',
                role: 'admin',
                auth_provider: 'google',
                department: 'Governança & Presidência',
                cargo: 'Administrador Master do Sistema',
                funcao_pericial: 'Administrador Master da Governança Previdenciária',
                ativo: true,
                email_verified: true,
                is_master_admin: true,
                is_presidente: true,
                avatar_url: '/src/assets/images/ipme_logo_correto_1792419543135.jpg',
                tenant_id: this.activeTenantId,
                created_at: '2026-01-01T08:00:00.000Z',
              });
            }
          }

          // Normalização e consolidação automática de secretarias em servidores e ocorrências
          if (parsed.employees && Array.isArray(parsed.employees)) {
            let dataRepaired = false;
            const secCatalog = parsed.secretarias || INITIAL_DATA.secretarias;
            for (const emp of parsed.employees) {
              if (emp.secretaria) {
                const norm = normalizeSecretaria(emp.secretaria, secCatalog);
                if (emp.secretaria !== norm.canonicalKey) {
                  emp.secretaria = norm.canonicalKey;
                  dataRepaired = true;
                }
              }
            }
            if (parsed.occurrences && Array.isArray(parsed.occurrences)) {
              for (const occ of parsed.occurrences) {
                const emp = parsed.employees.find((e: Employee) => e.matricula === occ.matricula);
                const rawSec = occ.employee_secretaria || emp?.secretaria;
                if (rawSec) {
                  const norm = normalizeSecretaria(rawSec, secCatalog);
                  if (occ.employee_secretaria !== norm.canonicalKey) {
                    occ.employee_secretaria = norm.canonicalKey;
                    dataRepaired = true;
                  }
                }
              }
            }
            if (dataRepaired) {
              this.saveToStorage(parsed);
            }
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage IPME, usando dados iniciais:', e);
    }
    const seed = this.activeTenantId === 'studio_sandbox'
      ? (JSON.parse(JSON.stringify(SANDBOX_INITIAL_DATA)) as DatabaseSchema)
      : (JSON.parse(JSON.stringify(INITIAL_DATA)) as DatabaseSchema);
    if (!seed.users || !Array.isArray(seed.users)) {
      seed.users = [];
    }
    if (this.activeTenantId === 'ipme_eusebio') {
      seed.users = JSON.parse(JSON.stringify(DEFAULT_IPME_USERS));
    } else if (this.activeTenantId === 'studio_sandbox') {
      seed.users = JSON.parse(JSON.stringify(DEFAULT_SANDBOX_USERS));
    } else {
      seed.users = [
        {
          id: `user_master_${this.activeTenantId}`,
          email: 'pliniocatunda@gmail.com',
          name: 'Plínio Catunda (Administrador Master)',
          role: 'admin',
          auth_provider: 'google',
          department: 'Governança Previdenciária',
          cargo: 'Administrador Master do Sistema',
          funcao_pericial: 'Administrador Master da Governança Previdenciária',
          ativo: true,
          email_verified: true,
          is_master_admin: true,
          is_presidente: true,
          avatar_url: '/src/assets/images/ipme_logo_correto_1792419543135.jpg',
          tenant_id: this.activeTenantId,
          created_at: '2026-01-01T08:00:00.000Z',
        }
      ];
    }
    this.saveToStorage(seed);
    return seed;
  }

  private saveToStorage(data: DatabaseSchema) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar no localStorage IPME:', e);
    }
  }

  private addAudit(entry: {
    entity_type: 'employee' | 'occurrence' | 'secretaria' | 'doctor' | 'user';
    entity_id: string;
    action: AuditLog['action'];
    details: string;
    changed_by: string;
    user_role: 'admin' | 'operator';
    diff?: { before?: Record<string, any>; after?: Record<string, any> };
  }) {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
  }

  private syncEmployeeStatus(matricula: string, actorEmail: string, actorRole: 'admin' | 'operator') {
    const emp = this.data.employees.find(e => e.matricula === matricula);
    if (!emp) return;

    const empOccurrences = this.data.occurrences.filter(
      o => o.matricula === matricula && (o.status === 'Ativa' || o.status === 'Prorrogada')
    );

    const hasArchivedDefinitiva = this.data.occurrences.some(
      o => o.matricula === matricula && o.tipo === 'Licença Definitiva' && o.status === 'Arquivado'
    );

    let newStatus: 'Ativo' | 'Licenciado' | 'Readaptado' | 'Aposentado' = 'Ativo';

    if (empOccurrences.length > 0) {
      const hasLicense = empOccurrences.some(o => o.tipo !== 'Readaptação' && o.tipo !== 'Readaptação Permanente');
      if (hasLicense) {
        newStatus = 'Licenciado';
      } else {
        newStatus = 'Readaptado';
      }
    } else if (hasArchivedDefinitiva) {
      newStatus = 'Aposentado';
    }

    if (emp.status !== newStatus) {
      const oldStatus = emp.status;
      emp.status = newStatus;
      emp.updated_at = new Date().toISOString();
      this.addAudit({
        entity_type: 'employee',
        entity_id: matricula,
        action: 'UPDATE',
        details: `Status funcional sincronizado automaticamente: de "${oldStatus}" para "${newStatus}".`,
        changed_by: actorEmail || 'Sistema IPME (Automação)',
        user_role: actorRole || 'admin',
        diff: { before: { status: oldStatus }, after: { status: newStatus } },
      });
    }
  }

  // --- Metrics ---
  public getMetrics(): DashboardMetrics {
    const totalServidores = this.data.employees.length;
    const servidoresAtivos = this.data.employees.filter(e => e.status === 'Ativo').length;

    const activeOccurrences = this.data.occurrences.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada');
    const totalLicencasSaude = this.data.occurrences.filter(o => o.tipo === 'Licença Saúde').length;
    const totalReadaptacoes = this.data.occurrences.filter(o => o.tipo === 'Readaptação' || o.tipo === 'Readaptação Permanente').length;
    const totalReadaptacaoPermanente = this.data.occurrences.filter(o => o.tipo === 'Readaptação Permanente').length;
    const totalLicencaMaternidade = this.data.occurrences.filter(o => o.tipo === 'Licença Maternidade').length;
    const totalLicencaDefinitiva = this.data.occurrences.filter(o => o.tipo === 'Licença Definitiva').length;
    const totalAposentados = this.data.employees.filter(e => e.status === 'Aposentado').length;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const totalLicencaSaudeConcluida30d = this.data.occurrences.filter(o => {
      if (o.tipo !== 'Licença Saúde' || o.status !== 'Concluída') return false;
      const d = (o.data_retorno || o.updated_at || o.data_termino || '').split('T')[0];
      return d >= thirtyDaysAgoStr && d <= todayStr;
    }).length;

    const totalDiasAfastamentoAcumulados = activeOccurrences.reduce((acc, curr) => acc + (curr.quantidade_dias || 0), 0);
    const totalDiasPagosPeloMunicipio = activeOccurrences.reduce((acc, curr) => acc + calcularDiasPagos(curr.quantidade_dias || 0), 0);

    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringSoon = activeOccurrences.filter(o => {
      if (!o.data_termino) return false;
      const term = new Date(o.data_termino + 'T23:59:59');
      return term >= now && term <= thirtyDaysFromNow;
    });

    const recentOccurrences = [...this.data.occurrences]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    const secMap: Record<string, { total: number; licencas: number; readaptados: number }> = {};
    this.data.employees.forEach(e => {
      const s = e.secretaria ? e.secretaria.split(' - ')[0].trim() : 'Outros';
      if (!secMap[s]) secMap[s] = { total: 0, licencas: 0, readaptados: 0 };
      secMap[s].total++;
    });

    // Contabiliza afastamentos por secretaria estritamente por tipo de ocorrência ativo
    this.data.occurrences.forEach(occ => {
      if (occ.status === 'Ativa' || occ.status === 'Prorrogada') {
        const rawSec = occ.employee_secretaria || '';
        const s = rawSec ? rawSec.split(' - ')[0].trim() : 'Outros';
        if (secMap[s]) {
          if (occ.tipo === 'Licença Saúde') {
            secMap[s].licencas++;
          } else if (occ.tipo === 'Readaptação' || occ.tipo === 'Readaptação Permanente') {
            secMap[s].readaptados++;
          }
        }
      }
    });

    const secretariaBreakdown = Object.entries(secMap).map(([secretaria, d]) => ({
      secretaria,
      count: d.total,
      licencaCount: d.licencas,
      readaptadoCount: d.readaptados,
    }));

    const typeCounts: Record<string, number> = {
      'Licença Saúde': 0,
      'Licença Maternidade': 0,
      'Licença Definitiva': 0,
      'Readaptação': 0,
      'Readaptação Permanente': 0,
      'Concluídas / Históricas': 0,
    };

    this.data.occurrences.forEach(o => {
      if (o.status === 'Concluída' || o.status === 'Cancelada') {
        typeCounts['Concluídas / Históricas']++;
      } else if (typeCounts[o.tipo] !== undefined) {
        typeCounts[o.tipo]++;
      }
    });

    const leaveTypeBreakdown = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    return {
      totalEmployees: totalServidores,
      totalAtivos: servidoresAtivos,
      totalLicencaSaude: totalLicencasSaude,
      totalReadaptados: totalReadaptacoes,
      totalReadaptacaoPermanente,
      totalLicencaMaternidade,
      totalLicencaDefinitiva,
      totalLicencaSaudeConcluida30d,
      totalAposentados,
      secretariaBreakdown,
      leaveTypeBreakdown,
      recentOccurrences,
      expiringSoon,
    };
  }

  // --- Employees ---
  public getEmployees(search?: string, secretaria?: string, status?: string): Employee[] {
    let result = Array.isArray(this.data.employees) ? [...this.data.employees] : [];
    if (search && search.trim()) {
      const s = search.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const sDigits = search.replace(/\D/g, '');
      result = result.filter(e => {
        if (!e) return false;
        const nome = String(e.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cargo = String(e.cargo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const mat = String(e.matricula || '').toLowerCase();
        const matDigits = mat.replace(/\D/g, '');
        const cpf = String(e.cpf || '');
        const cpfDigits = cpf.replace(/\D/g, '');
        return (
          nome.includes(s) ||
          mat.includes(s) ||
          (sDigits.length > 0 && matDigits.includes(sDigits)) ||
          cpf.includes(s) ||
          (sDigits.length > 0 && cpfDigits.includes(sDigits)) ||
          cargo.includes(s)
        );
      });
    }
    if (secretaria && secretaria !== 'ALL') {
      const secNorm = secretaria.toLowerCase().trim();
      result = result.filter(e => e && String(e.secretaria || '').toLowerCase().includes(secNorm));
    }
    if (status && status !== 'ALL') {
      result = result.filter(e => e && e.status === status);
    }
    return result;
  }

  public getEmployeeByMatricula(matricula: string): Employee | undefined {
    return this.data.employees.find(e => e.matricula === matricula);
  }

  public saveEmployee(empData: Partial<Employee>, actorEmail: string, actorRole: 'admin' | 'operator'): Employee {
    const rawMatricula = String(empData.matricula || '').trim().toUpperCase();
    const cleanMatricula = formatarMatricula(rawMatricula);
    const cleanCpf = limparCaracteres(empData.cpf || '');

    const existingIndex = this.data.employees.findIndex(
      e => formatarMatricula(e.matricula) === cleanMatricula
    );
    const now = new Date().toISOString();
    const normalizedSec = empData.secretaria
      ? normalizeSecretaria(empData.secretaria, this.data.secretarias).canonicalKey
      : 'SME - SECRETARIA DE EDUCACAO';

    if (existingIndex >= 0) {
      const old = this.data.employees[existingIndex];
      const updated: Employee = {
        ...old,
        ...empData,
        matricula: cleanMatricula,
        cpf: empData.cpf ? formatarCPF(empData.cpf) : old.cpf,
        secretaria: normalizedSec,
        updated_at: now,
      } as Employee;
      this.data.employees[existingIndex] = updated;

      // Sincroniza também as ocorrências do servidor com a secretaria canônica
      for (const occ of this.data.occurrences) {
        if (formatarMatricula(occ.matricula) === cleanMatricula) {
          occ.employee_secretaria = normalizedSec;
        }
      }

      this.addAudit({
        entity_type: 'employee',
        entity_id: updated.matricula,
        action: 'UPDATE',
        details: `Dados do servidor ${updated.nome} (${updated.matricula}) atualizados.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return updated;
    } else {
      // Regra de integridade: Matrícula exclusiva
      const existingSameMatricula = this.data.employees.find(
        e => formatarMatricula(e.matricula) === cleanMatricula
      );
      if (existingSameMatricula) {
        throw new Error(`A Matrícula ${cleanMatricula} já está vinculada ao servidor ${existingSameMatricula.nome}. A matrícula deve ser exclusiva.`);
      }

      const newEmp: Employee = {
        matricula: cleanMatricula || String(Date.now()).slice(-6).padStart(6, '0'),
        nome: empData.nome || '',
        cpf: empData.cpf ? formatarCPF(empData.cpf) : '',
        telefone: empData.telefone || '',
        secretaria: normalizedSec,
        setor: empData.setor || '',
        cargo: empData.cargo || 'Servidor Municipal',
        status: (empData.status as any) || 'Ativo',
        data_admissao: empData.data_admissao || now.split('T')[0],
        email: empData.email || '',
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
      };
      this.data.employees.push(newEmp);
      this.addAudit({
        entity_type: 'employee',
        entity_id: newEmp.matricula,
        action: 'CREATE',
        details: `Novo servidor cadastrado: ${newEmp.nome} (${newEmp.matricula}). Cargo: ${newEmp.cargo}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return newEmp;
    }
  }

  public deleteEmployee(matricula: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    const index = this.data.employees.findIndex(e => e.matricula === matricula);
    if (index === -1) throw new Error('Servidor não encontrado.');
    const emp = this.data.employees[index];

    const hasOccurrences = this.data.occurrences.some(o => o.matricula === matricula);
    if (hasOccurrences) {
      throw new Error('Não é possível excluir servidor que possui histórico de licenças/readaptações.');
    }

    this.data.employees.splice(index, 1);
    this.addAudit({
      entity_type: 'employee',
      entity_id: matricula,
      action: 'DELETE',
      details: `Servidor ${emp.nome} (${emp.matricula}) excluído do sistema.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return true;
  }

  // --- Occurrences ---
  public getOccurrences(matricula?: string, tipo?: string, status?: string, dataInicio?: string, dataTermino?: string): Occurrence[] {
    let result = [...this.data.occurrences];
    if (matricula) result = result.filter(o => o.matricula === matricula);
    if (tipo) result = result.filter(o => o.tipo === tipo);
    if (status) result = result.filter(o => o.status === status);
    if (dataInicio) result = result.filter(o => o.data_inicio >= dataInicio);
    if (dataTermino) result = result.filter(o => o.data_termino <= dataTermino);

    return result
      .map(o => {
        const emp = this.getEmployeeByMatricula(o.matricula);
        const rawSec = (emp ? emp.secretaria : o.employee_secretaria) || '';
        const normSec = normalizeSecretaria(rawSec, this.data.secretarias);
        return {
          ...o,
          employee_nome: emp ? emp.nome : o.employee_nome,
          employee_cargo: emp ? emp.cargo : o.employee_cargo,
          employee_secretaria: normSec.canonicalKey,
        };
      })
      .sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ""), 10);
        const numB = parseInt(b.id.replace(/\D/g, ""), 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numA - numB;
        }
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
  }

  public getOccurrenceById(id: string): Occurrence | undefined {
    return this.data.occurrences.find(o => o.id === id);
  }

  public saveOccurrence(occurrenceData: Partial<Occurrence>, actorEmail: string, actorRole: 'admin' | 'operator'): Occurrence {
    const now = new Date().toISOString();

    if (occurrenceData.id) {
      // Update
      const index = this.data.occurrences.findIndex(o => o.id === occurrenceData.id);
      if (index === -1) throw new Error('Ocorrência não encontrada para edição.');
      const old = this.data.occurrences[index];

      const updated: Occurrence = {
        ...old,
        ...occurrenceData,
        updated_at: now,
      } as Occurrence;

      this.data.occurrences[index] = updated;
      this.syncEmployeeStatus(updated.matricula, actorEmail, actorRole);

      this.addAudit({
        entity_type: 'occurrence',
        entity_id: updated.id,
        action: 'UPDATE',
        details: `Ocorrência Nº ${updated.id} (${updated.tipo}) do servidor ${updated.employee_nome} atualizada.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToStorage(this.data);
      return updated;
    } else {
      // Regra de Negócio: Licença Definitiva não pode ser criada diretamente
      if (occurrenceData.tipo === 'Licença Definitiva') {
        throw new Error('A Licença Definitiva não pode ser cadastrada diretamente. Ela deve ser originada a partir da conversão de uma Licença Ativa ou Prorrogada via "Tornar Definitiva".');
      }

      const emp = this.getEmployeeByMatricula(occurrenceData.matricula || '');
      if (!emp) throw new Error('Servidor não encontrado para a matrícula informada.');

      // Regra de Integridade: Não permitir criar nova licença se o servidor já tiver uma licença com status Ativa ou Prorrogada (mesmo em atraso)
      const existingActiveOcc = this.data.occurrences.find(
        o => o.matricula.toUpperCase() === emp.matricula.toUpperCase() &&
             (o.status === 'Ativa' || o.status === 'Prorrogada')
      );
      if (existingActiveOcc) {
        const isAtrasado = existingActiveOcc.data_termino < new Date().toISOString().split('T')[0];
        const atrasoMsg = isAtrasado ? ' (atualmente com previsão de retorno em atraso)' : '';
        throw new Error(
          `Bloqueio de Integridade: O servidor ${emp.nome} (${emp.matricula}) já possui um afastamento ativo em andamento (Ocorrência Nº ${existingActiveOcc.id} - ${existingActiveOcc.tipo}${atrasoMsg}, término previsto: ${existingActiveOcc.data_termino}). Para garantir a integridade cadastral e evitar sobreposição de licenças, conclua a perícia de retorno, homologue a prorrogação ou cancele o afastamento existente antes de registrar uma nova licença.`
        );
      }

      const existingNumericIds = this.data.occurrences
        .map(o => parseInt(o.id, 10))
        .filter(n => !isNaN(n));
      const nextNum = existingNumericIds.length > 0 ? Math.max(...existingNumericIds) + 1 : 1;
      const newId = String(nextNum);

      let dias = occurrenceData.quantidade_dias || 0;
      if (!dias && occurrenceData.data_inicio && occurrenceData.data_termino) {
        const start = new Date(occurrenceData.data_inicio + 'T00:00:00');
        const end = new Date(occurrenceData.data_termino + 'T00:00:00');
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        dias = diff > 0 ? diff : 1;
      }

      const newOcc: Occurrence = {
        id: newId,
        matricula: emp.matricula,
        employee_nome: emp.nome,
        employee_cargo: emp.cargo,
        employee_secretaria: normalizeSecretaria(emp.secretaria, this.data.secretarias).canonicalKey,
        tipo: occurrenceData.tipo || 'Licença Saúde',
        data_inicio: occurrenceData.data_inicio || now.split('T')[0],
        data_termino: occurrenceData.data_termino || now.split('T')[0],
        data_termino_inicial: occurrenceData.data_termino || now.split('T')[0],
        quantidade_dias: dias,
        cid: occurrenceData.cid || '',
        medico_perito: occurrenceData.medico_perito || 'Dr. Marcelo Cavalcante Holanda',
        crm: occurrenceData.crm || 'CRM/CE 14.892',
        status: 'Ativa',
        anexo_url: occurrenceData.anexo_url || '',
        anexo_nome: occurrenceData.anexo_nome || '',
        observacoes: occurrenceData.observacoes || '',
        parecer_tecnico: occurrenceData.parecer_tecnico || '',
        prorrogacoes: [],
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
      };

      this.data.occurrences.unshift(newOcc);
      this.syncEmployeeStatus(emp.matricula, actorEmail, actorRole);

      this.addAudit({
        entity_type: 'occurrence',
        entity_id: newOcc.id,
        action: 'CREATE',
        details: `Novo registro de ${newOcc.tipo} aberto para ${emp.nome} (${emp.matricula}). Período: ${newOcc.data_inicio} até ${newOcc.data_termino} (${newOcc.quantidade_dias} dias).`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToStorage(this.data);
      return newOcc;
    }
  }

  public prorrogarOccurrence(
    id: string,
    data: { novaDataTermino: string; motivo: string; medico?: string; crm?: string },
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    if (occ.tipo === 'Licença Definitiva') {
      throw new Error('A Licença Definitiva/Permanente não pode ser prorrogada.');
    }

    if (occ.status !== 'Ativa' && occ.status !== 'Prorrogada') {
      throw new Error(`Apenas licenças com status Ativa ou Prorrogada podem ser prorrogadas. Status atual: ${occ.status}.`);
    }

    const { novaDataTermino, motivo, medico, crm } = data;
    const oldTermino = occ.data_termino;
    if (new Date(novaDataTermino) <= new Date(oldTermino)) {
      throw new Error(`A nova data de término (${novaDataTermino}) deve ser posterior à data atual de término (${oldTermino}).`);
    }

    const oldEnd = new Date(oldTermino + 'T00:00:00');
    const newEnd = new Date(novaDataTermino + 'T00:00:00');
    const addedDays = Math.ceil((newEnd.getTime() - oldEnd.getTime()) / (1000 * 60 * 60 * 24));

    const totalDays = (occ.quantidade_dias || 0) + addedDays;
    const prorrogacoes = occ.prorrogacoes || [];
    const seq = prorrogacoes.length + 1;
    const now = new Date().toISOString();

    const record = {
      id: `PRORR-${occ.id}-${seq}`,
      sequencial: seq,
      data_anterior_termino: oldTermino,
      nova_data_termino: novaDataTermino,
      dias_adicionados: addedDays,
      dias_totais_acumulados: totalDays,
      dias_pagos_acumulados: calcularDiasPagos(totalDays),
      motivo,
      medico_perito: medico || occ.medico_perito,
      crm: crm || occ.crm,
      created_at: now,
      created_by: actorEmail,
    };

    occ.prorrogacoes = [...prorrogacoes, record];
    occ.data_termino = novaDataTermino;
    occ.quantidade_dias = totalDays;
    occ.status = 'Prorrogada';
    occ.updated_at = now;
    if (medico) occ.medico_perito = medico;
    if (crm) occ.crm = crm;

    this.addAudit({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'PRORROGAR',
      details: `${seq}ª Prorrogação da ${occ.tipo} Nº ${occ.id} concedida até ${novaDataTermino} (+${addedDays} dias, total ${totalDays}d). Perito: ${record.medico_perito}. Motivo: ${motivo}.`,
      changed_by: actorEmail,
      user_role: actorRole,
      diff: {
        before: { data_termino: oldTermino, quantidade_dias: occ.quantidade_dias - addedDays },
        after: { data_termino: novaDataTermino, quantidade_dias: totalDays, dias_adicionados: addedDays, prorrogacao_id: record.id },
      },
    });

    this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);
    this.saveToStorage(this.data);
    return occ;
  }

  public concluirOccurrence(
    id: string,
    parecerFinal: string,
    actorEmail: string,
    actorRole: 'admin' | 'operator',
    dataConcessao?: string,
    atoConcessao?: string
  ): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    const now = new Date().toISOString();
    const dataHoraBR = new Date().toLocaleDateString('pt-BR');
    const isDefinitiva = occ.tipo === 'Licença Definitiva';

    if (isDefinitiva) {
      if (!dataConcessao || !dataConcessao.trim()) {
        throw new Error('A Data de Concessão é obrigatória para a conclusão e arquivamento definitivo da Licença Definitiva.');
      }
      occ.data_concessao = dataConcessao.trim();
      if (atoConcessao && atoConcessao.trim()) {
        occ.ato_concessao = atoConcessao.trim();
      }
      occ.status = 'Arquivado';
      occ.updated_at = now;
      occ.parecer_tecnico = (occ.parecer_tecnico ? occ.parecer_tecnico + '\n' : '') + `[Conclusão / Arquivamento em ${dataHoraBR} por ${actorEmail}]: Homologada a aposentadoria definitiva do servidor. Data de Concessão: ${occ.data_concessao}. Ato: ${occ.ato_concessao || 'N/A'}. Parecer: ${parecerFinal || 'Afastamento definitivo homologado em perícia oficial.'}`;

      this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);

      this.addAudit({
        entity_type: 'occurrence',
        entity_id: occ.id,
        action: 'ARQUIVAR',
        details: `Conclusão e arquivamento definitivo da Licença Definitiva Nº ${occ.id} (Aposentadoria homologada). Data de Concessão: ${occ.data_concessao}. Parecer: ${parecerFinal}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
    } else {
      occ.status = 'Concluída';
      occ.updated_at = now;
      if (parecerFinal) {
        occ.parecer_tecnico = (occ.parecer_tecnico ? occ.parecer_tecnico + '\n' : '') + `[Conclusão Pericial em ${dataHoraBR} por ${actorEmail}]: ${parecerFinal}`;
      }

      this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);

      this.addAudit({
        entity_type: 'occurrence',
        entity_id: occ.id,
        action: 'CONCLUIR',
        details: `Conclusão e encerramento pericial da ${occ.tipo} Nº ${occ.id}. Parecer: ${parecerFinal || 'Perícia de retorno favorável.'}`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
    }

    this.saveToStorage(this.data);
    return occ;
  }

  public retornarTrabalhoOccurrence(
    id: string,
    data: { dataRetorno: string; motivoRetorno: string; medico?: string; crm?: string; atoReversao?: string },
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    if (occ.tipo !== 'Licença Definitiva') {
      throw new Error('A ação de Retorno ao Trabalho por reversão pericial aplica-se à Licença Definitiva.');
    }

    if (!data.dataRetorno || !data.dataRetorno.trim()) {
      throw new Error('A Data do Retorno ao Trabalho é obrigatória.');
    }

    const now = new Date().toISOString();
    const dataHoraBR = new Date().toLocaleDateString('pt-BR');

    occ.status = 'Concluída';
    occ.data_retorno = data.dataRetorno.trim();
    occ.motivo_retorno = data.motivoRetorno?.trim() || 'Reversão pericial homologada pela Junta Médica Oficial.';
    occ.updated_at = now;
    if (data.medico) occ.medico_perito = data.medico;
    if (data.crm) occ.crm = data.crm;

    occ.parecer_tecnico = (occ.parecer_tecnico ? occ.parecer_tecnico + '\n' : '') + `[Reversão / Retorno ao Trabalho em ${dataHoraBR} por ${actorEmail}]: Reversão homologada com retorno às atividades funcionais em ${occ.data_retorno}. Ato: ${data.atoReversao || 'N/A'}. Perito: ${occ.medico_perito} (${occ.crm}). Parecer: ${occ.motivo_retorno}`;

    this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);

    this.addAudit({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'RETORNO_TRABALHO',
      details: `Reversão pericial e retorno ao trabalho da Licença Definitiva Nº ${occ.id} (Servidor: ${occ.employee_nome}). Data de Retorno: ${occ.data_retorno}. Perito: ${occ.medico_perito} (${occ.crm}).`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToStorage(this.data);
    return occ;
  }

  public converterOccurrenceDefinitiva(
    id: string,
    data: { dataConcessao: string; atoConcessao?: string; motivo?: string; medico?: string; crm?: string; parecerTecnico?: string },
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    if (occ.status !== 'Ativa' && occ.status !== 'Prorrogada') {
      throw new Error(`Apenas licenças com status Ativa ou Prorrogada podem ser convertidas em definitiva. Status atual: ${occ.status}.`);
    }

    const { dataConcessao, atoConcessao, motivo, medico, crm, parecerTecnico } = data;

    if (!dataConcessao || !dataConcessao.trim()) {
      throw new Error('A Data da Concessão é obrigatória para tornar a licença definitiva.');
    }

    // REGRA DE NEGÓCIO IPME SOLICITADA:
    // "Ela não poderá ser concedida dentro do prazo vigente de licença, ou seja só após essa data."
    if (occ.data_termino && dataConcessao.trim() <= occ.data_termino) {
      throw new Error(`A licença permanente não poderá ser concedida dentro do prazo vigente de licença (vigente até ${occ.data_termino}). A Data da Concessão deve ser posterior ao término da licença atual.`);
    }

    const now = new Date().toISOString();
    const oldTipo = occ.tipo;
    occ.tipo = 'Licença Definitiva';
    occ.status = 'Ativa';
    occ.data_concessao = dataConcessao.trim();
    occ.ato_concessao = atoConcessao?.trim() || '';
    occ.motivo_definitiva = motivo?.trim() || 'Incapacidade laborativa definitiva homologada em junta pericial.';
    occ.data_conversao = now;
    occ.updated_at = now;
    if (medico) occ.medico_perito = medico;
    if (crm) occ.crm = crm;

    const nota = `\n[Conversão em Licença Definitiva em ${new Date().toLocaleDateString('pt-BR')} por ${actorEmail}]: Licença transformada de "${oldTipo}" para "Licença Definitiva". Data da Concessão: ${occ.data_concessao} | Ato Concessório: ${occ.ato_concessao || 'Não informado'}. Médico Responsável: ${occ.medico_perito} (${occ.crm}). Justificativa: ${occ.motivo_definitiva}${parecerTecnico ? ' | Parecer Conclusivo: ' + parecerTecnico : ''}`;
    occ.parecer_tecnico = (occ.parecer_tecnico || '') + nota;

    this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);

    this.addAudit({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'CONVERTER_DEFINITIVA',
      details: `Ocorrência Nº ${occ.id} do servidor ${occ.employee_nome} convertida em Licença Definitiva. Data de Concessão: ${occ.data_concessao}. Ato: ${occ.ato_concessao || 'N/A'}.`,
      changed_by: actorEmail,
      user_role: actorRole,
      diff: {
        before: { tipo: oldTipo },
        after: { tipo: 'Licença Definitiva', data_concessao: occ.data_concessao, ato_concessao: occ.ato_concessao },
      },
    });

    this.saveToStorage(this.data);
    return occ;
  }

  public converterOccurrencePermanente(
    id: string,
    data: { dataConcessao: string; atoConcessao?: string; motivo?: string; medico?: string; crm?: string; parecerTecnico?: string },
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    // REGRA DE NEGÓCIO IPME SOLICITADA:
    // "ela será aplicada apenas para os servidores que se encontram de com um READAPTAÇÃO FUNCIONAL em curso, e se tornara dessa forma PERMANENTE"
    // "A readaptação permanente só será aplicada para que já possui uma readaptação."
    if (occ.tipo !== 'Readaptação') {
      throw new Error(`A Readaptação Permanente só pode ser aplicada a servidores com Readaptação Funcional em curso. Tipo atual desta ocorrência: "${occ.tipo}".`);
    }

    if (occ.status !== 'Ativa' && occ.status !== 'Prorrogada') {
      throw new Error(`Apenas readaptações com status Ativa ou Prorrogada podem ser convertidas em permanente. Status atual: ${occ.status}.`);
    }

    const { dataConcessao, atoConcessao, motivo, medico, crm, parecerTecnico } = data;

    if (!dataConcessao || !dataConcessao.trim()) {
      throw new Error('A Data da Concessão é obrigatória para homologar a readaptação permanente.');
    }

    const now = new Date().toISOString();
    const oldTipo = occ.tipo;
    occ.tipo = 'Readaptação Permanente';
    occ.status = 'Ativa';
    occ.data_concessao = dataConcessao.trim();
    occ.ato_concessao = atoConcessao?.trim() || '';
    occ.motivo_permanente = motivo?.trim() || 'Readaptação funcional permanente homologada em junta médica oficial do IPME.';
    occ.data_conversao = now;
    occ.updated_at = now;
    if (medico) occ.medico_perito = medico;
    if (crm) occ.crm = crm;

    const dataHoraBR = new Date().toLocaleDateString('pt-BR');
    const nota = `\n[Conversão em Readaptação Permanente em ${dataHoraBR} por ${actorEmail}]: Readaptação transformada de "${oldTipo}" para "Readaptação Permanente". Data da Concessão: ${occ.data_concessao} | Ato Concessório: ${occ.ato_concessao || 'Não informado'}. Médico Responsável: ${occ.medico_perito} (${occ.crm}). Justificativa/Parecer da Junta: ${occ.motivo_permanente}${parecerTecnico ? ' | Parecer Conclusivo / Restrições Definitivas: ' + parecerTecnico : ''}`;
    occ.parecer_tecnico = (occ.parecer_tecnico || '') + nota;

    this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);

    this.addAudit({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'CONVERTER_PERMANENTE',
      details: `Ocorrência Nº ${occ.id} do servidor ${occ.employee_nome} convertida em Readaptação Permanente. Data de Concessão: ${occ.data_concessao}. Ato: ${occ.ato_concessao || 'N/A'}.`,
      changed_by: actorEmail,
      user_role: actorRole,
      diff: {
        before: { tipo: oldTipo },
        after: { tipo: 'Readaptação Permanente', data_concessao: occ.data_concessao, ato_concessao: occ.ato_concessao },
      },
    });

    this.saveToStorage(this.data);
    return occ;
  }

  public cancelarOccurrence(id: string, motivo: string, actorEmail: string, actorRole: 'admin' | 'operator'): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    const now = new Date().toISOString();
    occ.status = 'Cancelada';
    occ.observacoes = (occ.observacoes ? occ.observacoes + '\n' : '') + `[Cancelada em ${new Date().toLocaleDateString('pt-BR')}]: ${motivo}`;
    occ.updated_at = now;

    this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);

    this.addAudit({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'CANCELAR',
      details: `Cancelamento da ${occ.tipo} Nº ${occ.id} do servidor ${occ.employee_nome}. Motivo: ${motivo}.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToStorage(this.data);
    return occ;
  }

  public deleteOccurrence(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    const index = this.data.occurrences.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Ocorrência não encontrada.');
    const occ = this.data.occurrences[index];

    this.data.occurrences.splice(index, 1);
    this.syncEmployeeStatus(occ.matricula, actorEmail, actorRole);

    this.addAudit({
      entity_type: 'occurrence',
      entity_id: id,
      action: 'DELETE',
      details: `Registro de ${occ.tipo} ${id} (Servidor: ${occ.employee_nome}) excluído definitivamente do sistema.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToStorage(this.data);
    return true;
  }

  // --- Secretarias ---
  public getSecretarias(): Secretaria[] {
    return this.data.secretarias.map(s => {
      const siglaNorm = (s.sigla || "").toLowerCase().trim();
      const nomeNorm = (s.nome || "").toLowerCase().trim();
      const servidoresCount = (this.data.employees || []).filter(e => {
        const sec = (e.secretaria || "").toLowerCase().trim();
        return sec === siglaNorm ||
               sec.startsWith(siglaNorm + " -") ||
               sec.endsWith("- " + siglaNorm) ||
               (nomeNorm && sec.includes(nomeNorm));
      }).length;
      return {
        ...s,
        servidores_count: servidoresCount,
      };
    });
  }

  public saveSecretaria(secData: Partial<Secretaria>, actorEmail: string, actorRole: 'admin' | 'operator'): Secretaria {
    const now = new Date().toISOString();
    const existingIndex = this.data.secretarias.findIndex(s => s.id === secData.id || s.sigla === secData.sigla);

    if (existingIndex >= 0) {
      const updated: Secretaria = {
        ...this.data.secretarias[existingIndex],
        ...secData,
        updated_at: now,
      } as Secretaria;
      this.data.secretarias[existingIndex] = updated;
      this.addAudit({
        entity_type: 'secretaria',
        entity_id: updated.id,
        action: 'UPDATE',
        details: `Secretaria ${updated.sigla} (${updated.nome}) atualizada.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return updated;
    } else {
      const newSec: Secretaria = {
        id: secData.id || `SEC-${secData.sigla || Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        sigla: secData.sigla || 'SEC',
        nome: secData.nome || 'Nova Secretaria',
        secretario: secData.secretario || '',
        email: secData.email || '',
        telefone: secData.telefone || '',
        endereco: secData.endereco || '',
        ativa: secData.ativa !== undefined ? secData.ativa : true,
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
      };
      this.data.secretarias.push(newSec);
      this.addAudit({
        entity_type: 'secretaria',
        entity_id: newSec.id,
        action: 'CREATE',
        details: `Nova Secretaria cadastrada: ${newSec.sigla} - ${newSec.nome}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return newSec;
    }
  }

  public deleteSecretaria(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    const index = this.data.secretarias.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Secretaria não encontrada.');
    const sec = this.data.secretarias[index];

    const hasEmps = this.data.employees.some(e => e.secretaria && e.secretaria.includes(sec.sigla));
    if (hasEmps) {
      throw new Error(`Não é possível excluir a secretaria ${sec.sigla} pois existem servidores vinculados a ela.`);
    }

    this.data.secretarias.splice(index, 1);
    this.addAudit({
      entity_type: 'secretaria',
      entity_id: id,
      action: 'DELETE',
      details: `Secretaria ${sec.sigla} (${sec.nome}) excluída do sistema IPME.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return true;
  }

  // --- Doctors ---
  public getDoctors(): Doctor[] {
    return [...this.data.doctors];
  }

  public saveDoctor(docData: Partial<Doctor>, actorEmail: string, actorRole: 'admin' | 'operator'): Doctor {
    const now = new Date().toISOString();
    const existingIndex = this.data.doctors.findIndex(d => d.crm === docData.crm || (docData.id && d.id === docData.id));

    if (existingIndex >= 0) {
      const updated: Doctor = {
        ...this.data.doctors[existingIndex],
        ...docData,
        updated_at: now,
      } as Doctor;
      this.data.doctors[existingIndex] = updated;
      this.addAudit({
        entity_type: 'doctor',
        entity_id: updated.crm,
        action: 'UPDATE',
        details: `Dados do médico ${updated.nome} (${updated.crm}) atualizados.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return updated;
    } else {
      const newDoc: Doctor = {
        id: docData.id || String(this.data.doctors.length + 1),
        nome: docData.nome || 'Dr. Médico Perito',
        crm: docData.crm || `CRM/CE ${Math.floor(10000 + Math.random() * 90000)}`,
        especialidade: docData.especialidade || 'Medicina do Trabalho',
        ativo: docData.ativo !== undefined ? docData.ativo : true,
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
        vinculo: docData.vinculo || 'Efetivo',
        is_diretor: docData.is_diretor || false,
      };
      this.data.doctors.push(newDoc);
      this.addAudit({
        entity_type: 'doctor',
        entity_id: newDoc.crm,
        action: 'CREATE',
        details: `Novo Médico Perito cadastrado no IPME: ${newDoc.nome} (${newDoc.crm}).`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return newDoc;
    }
  }

  public getDoctorById(idOrCrm: string): Doctor | undefined {
    if (!idOrCrm) return undefined;
    const search = String(idOrCrm).trim();
    const searchLower = search.toLowerCase();
    const searchDigits = search.replace(/\D/g, '');
    return this.data.doctors.find(d => {
      if (String(d.id).trim() === search) return true;
      if (d.crm.trim().toLowerCase() === searchLower) return true;
      if (searchDigits && searchDigits.length >= 4 && d.crm.replace(/\D/g, '') === searchDigits) return true;
      if (d.nome.toLowerCase().trim() === searchLower) return true;
      return false;
    });
  }

  public deleteDoctor(idOrCrm: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    if (actorRole !== 'admin') {
      throw new Error('Apenas Administradores podem excluir médicos do cadastro.');
    }
    const search = String(idOrCrm).trim();
    const searchLower = search.toLowerCase();
    const searchDigits = search.replace(/\D/g, '');

    const index = this.data.doctors.findIndex(d => {
      if (String(d.id).trim() === search) return true;
      if (d.crm.trim().toLowerCase() === searchLower) return true;
      if (searchDigits && searchDigits.length >= 4 && d.crm.replace(/\D/g, '') === searchDigits) return true;
      if (d.nome.toLowerCase().trim() === searchLower) return true;
      return false;
    });

    if (index === -1) {
      throw new Error('Médico não localizado no cadastro.');
    }

    const doc = this.data.doctors[index];
    const wasDirector = Boolean(doc.is_diretor);

    this.data.doctors.splice(index, 1);

    // Se o médico excluído era o diretor oficial e ainda restarem médicos, definir o primeiro ativo como diretor
    if (wasDirector && this.data.doctors.length > 0) {
      const nextDirector = this.data.doctors.find(d => d.ativo) || this.data.doctors[0];
      nextDirector.is_diretor = true;
    }

    this.addAudit({
      entity_type: 'doctor',
      entity_id: doc.crm,
      action: 'DELETE',
      details: `Médico ${doc.nome} (${doc.crm}) excluído do sistema IPME por ${actorEmail}. Registros e laudos anteriores mantidos no histórico documental.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return true;
  }

  public toggleDoctorStatus(idOrCrm: string, actorEmail: string, actorRole: 'admin' | 'operator'): Doctor {
    const doc = this.getDoctorById(idOrCrm);
    if (!doc) throw new Error('Médico não localizado no cadastro.');
    doc.ativo = !doc.ativo;
    doc.updated_at = new Date().toISOString();
    this.addAudit({
      entity_type: 'doctor',
      entity_id: doc.crm,
      action: 'UPDATE',
      details: `Status do médico ${doc.nome} (${doc.crm}) alterado para: ${doc.ativo ? 'ATIVO' : 'INATIVO'}.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return doc;
  }

  public setDoctorDiretor(idOrCrm: string, actorEmail: string, actorRole: 'admin' | 'operator'): Doctor {
    const doc = this.getDoctorById(idOrCrm);
    if (!doc) throw new Error('Médico não localizado no cadastro.');
    for (const d of this.data.doctors) {
      d.is_diretor = false;
    }
    doc.is_diretor = true;
    doc.ativo = true;
    doc.updated_at = new Date().toISOString();
    this.addAudit({
      entity_type: 'doctor',
      entity_id: doc.crm,
      action: 'UPDATE',
      details: `Dr(a). ${doc.nome} (${doc.crm}) definido como Médico Diretor da Junta Médica Pericial Oficial.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return doc;
  }

  public clearOccurrences(actorEmail: string, actorRole: 'admin' | 'operator'): { deletedOccurrences: number } {
    const count = this.data.occurrences.length;
    this.data.occurrences = [];
    for (const emp of this.data.employees) {
      emp.status = 'Ativo';
      emp.updated_at = new Date().toISOString();
    }
    this.addAudit({
      entity_type: 'occurrence',
      entity_id: 'ALL',
      action: 'DELETE',
      details: `Todas as ${count} ocorrências de licença e readaptação foram zeradas pelo administrador. Servidores redefinidos como Ativos.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return { deletedOccurrences: count };
  }

  // --- Audit Logs ---
  public getAuditLogs(entityType?: string, entityId?: string, action?: string): AuditLog[] {
    let result = [...this.data.audit_logs];
    if (entityType) result = result.filter(l => l.entity_type === entityType);
    if (entityId) result = result.filter(l => l.entity_id === entityId);
    if (action) result = result.filter(l => l.action === action);
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- Users ---
  public getUsers(): AppUser[] {
    return [...this.data.users];
  }

  public syncUsers(serverUsers: AppUser[]): void {
    if (!Array.isArray(serverUsers)) return;
    if (this.activeTenantId === 'ipme_eusebio') {
      const userMap = new Map<string, AppUser>();
      serverUsers.forEach(u => {
        if (u && u.email) userMap.set(u.email.toLowerCase().trim(), u);
      });
      DEFAULT_IPME_USERS.forEach(defU => {
        const key = defU.email.toLowerCase().trim();
        if (!userMap.has(key)) {
          userMap.set(key, { ...defU });
        } else {
          const existing = userMap.get(key)!;
          if (key === 'plinio.camara@ipmeusebio.ce.gov.br') {
            if (!existing.cargo || existing.cargo.includes('Médico') || existing.cargo.includes('Operador') || existing.cargo.includes('Assistente')) {
              existing.cargo = 'Presidente do IPME';
            }
            if (!existing.funcao_pericial) existing.funcao_pericial = 'Presidente do IPME';
            existing.is_presidente = true;
          }
          if (!existing.password) existing.password = defU.password;
          if (existing.ativo === undefined) existing.ativo = true;
        }
      });
      this.data.users = Array.from(userMap.values());
    } else {
      // Nos outros ambientes, garante que os operadores de Eusébio não vazem
      this.data.users = serverUsers.filter(u => 
        u.email?.toLowerCase().trim() !== 'plinio.camara@ipmeusebio.ce.gov.br' &&
        u.email?.toLowerCase().trim() !== 'plinio.catunda@ipmeusebio.ce.gov.br'
      );
      if (!this.data.users.some(u => u.email?.toLowerCase().trim() === 'pliniocatunda@gmail.com')) {
        this.data.users.unshift({
          id: `user_master_${this.activeTenantId}`,
          email: 'pliniocatunda@gmail.com',
          name: 'Plínio Catunda (Administrador Master)',
          role: 'admin',
          auth_provider: 'google',
          department: 'Governança & Presidência',
          cargo: 'Administrador Master do Sistema',
          funcao_pericial: 'Administrador Master da Governança Previdenciária',
          ativo: true,
          email_verified: true,
          is_master_admin: true,
          is_presidente: true,
          avatar_url: '/src/assets/images/ipme_logo_correto_1792419543135.jpg',
          tenant_id: this.activeTenantId,
          created_at: '2026-01-01T08:00:00.000Z',
        });
      }
    }
    this.saveToStorage(this.data);
  }

  public upsertUser(user: AppUser): void {
    if (!user || !user.email) return;
    const emailNorm = user.email.toLowerCase();
    user.tenant_id = user.tenant_id || this.activeTenantId;
    const idx = this.data.users.findIndex(u => u.email.toLowerCase() === emailNorm);
    if (idx >= 0) {
      this.data.users[idx] = { ...this.data.users[idx], ...user };
    } else {
      this.data.users.push(user);
    }
    this.saveToStorage(this.data);
  }

  public saveUser(userData: Partial<AppUser>, actorEmail: string, actorRole: 'admin' | 'operator'): AppUser {
    if (actorRole !== 'admin') {
      throw new Error('Apenas o Administrador Master pode cadastrar ou alterar operadores.');
    }
    const emailNorm = (userData.email || '').trim().toLowerCase();
    if (!emailNorm) throw new Error('E-mail corporativo é obrigatório.');

    const isMaster = emailNorm === 'pliniocatunda@gmail.com';
    const now = new Date().toISOString();
    const existingIndex = this.data.users.findIndex(u => u.email.toLowerCase() === emailNorm);

    // Regra institucional: Apenas um único usuário pode ser designado como Presidente dentro deste ambiente
    if (userData.is_presidente === true) {
      this.data.users.forEach(u => {
        if (u.email.toLowerCase() !== emailNorm) {
          u.is_presidente = false;
        }
      });
    }

    if (existingIndex >= 0) {
      const existing = this.data.users[existingIndex];
      const updated: AppUser = {
        ...existing,
        ...userData,
        email: existing.email,
        tenant_id: this.activeTenantId,
        role: isMaster ? 'admin' : (userData.role || 'operator'),
        auth_provider: isMaster ? 'google' : 'corporate',
        cargo: userData.cargo !== undefined ? userData.cargo.trim() : existing.cargo,
        funcao_pericial: userData.funcao_pericial !== undefined ? userData.funcao_pericial.trim() : existing.funcao_pericial,
        is_presidente: userData.is_presidente !== undefined ? !!userData.is_presidente : (existing.is_presidente ?? false),
        ativo: isMaster ? true : (userData.ativo !== undefined ? userData.ativo : existing.ativo ?? true),
        password: userData.password ? userData.password.trim() : existing.password || 'Ipme@2026',
        email_verified: isMaster ? true : (userData.email_verified !== undefined ? userData.email_verified : existing.email_verified ?? true),
        must_change_password: isMaster ? false : (userData.must_change_password !== undefined ? userData.must_change_password : existing.must_change_password ?? false),
      };
      this.data.users[existingIndex] = updated;
      this.addAudit({
        entity_type: 'user',
        entity_id: updated.email,
        action: 'UPDATE',
        details: `Operador ${updated.name} (${updated.email}) atualizado no ambiente ${this.activeTenantId}. Cargo: ${updated.cargo || 'N/A'}. Função: ${updated.funcao_pericial || 'N/A'}. Presidente: ${updated.is_presidente ? 'Sim' : 'Não'}. Lotação: ${updated.department}. Status: ${updated.ativo !== false ? 'Ativo' : 'Inativo'}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return updated;
    } else {
      const initialPassword = userData.password && userData.password.trim()
        ? userData.password.trim()
        : `Ipme@${Math.floor(1000 + Math.random() * 9000)}`;

      const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const confirmationToken = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newUser: AppUser = {
        id: userData.id || `user_${Date.now()}`,
        email: emailNorm,
        name: userData.name || emailNorm.split('@')[0],
        role: isMaster ? 'admin' : (userData.role || 'operator'),
        auth_provider: isMaster ? 'google' : 'corporate',
        tenant_id: this.activeTenantId,
        department: userData.department || (this.activeTenantId === 'ipme_eusebio' ? 'IPME - Junta Médica Pericial' : 'Junta Médica Pericial'),
        cargo: userData.cargo ? userData.cargo.trim() : (isMaster ? 'Administrador Master do Sistema' : 'Operador Pericial'),
        funcao_pericial: userData.funcao_pericial ? userData.funcao_pericial.trim() : (isMaster ? 'Administrador Master da Governança Previdenciária' : 'Operador da Junta Médica Pericial'),
        is_presidente: userData.is_presidente !== undefined ? !!userData.is_presidente : false,
        telefone: userData.telefone || '',
        ativo: userData.ativo !== undefined ? userData.ativo : true,
        avatar_url: userData.avatar_url || (isMaster ? '/src/assets/images/ipme_logo_correto_1792419543135.jpg' : ''),
        password: initialPassword,
        email_verified: true,
        must_change_password: isMaster ? false : (userData.must_change_password !== undefined ? userData.must_change_password : false),
        created_at: now,
      };
      this.data.users.push(newUser);
      this.addAudit({
        entity_type: 'user',
        entity_id: newUser.email,
        action: 'CREATE',
        details: `Novo operador corporativo credenciado no ambiente ${this.activeTenantId}: ${newUser.name} (${newUser.email}). Cargo: ${newUser.cargo}. Função: ${newUser.funcao_pericial}. Presidente: ${newUser.is_presidente ? 'Sim' : 'Não'}. Senha inicial definida.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return newUser;
    }
  }

  public confirmEmail(email: string, codeOrToken: string, actorEmail: string = 'Sistema IPME'): AppUser {
    const emailNorm = (email || '').trim().toLowerCase();
    const user = this.data.users.find(u => u.email.toLowerCase() === emailNorm);
    if (!user) {
      throw new Error(`Operador com o e-mail "${email}" não encontrado.`);
    }

    const trimmedInput = (codeOrToken || '').trim();
    const matchesCode = user.confirmation_code && user.confirmation_code === trimmedInput;
    const matchesToken = user.confirmation_token && user.confirmation_token === trimmedInput;

    if (!matchesCode && !matchesToken) {
      throw new Error('Código ou link de confirmação inválido ou expirado. Verifique o código de 6 dígitos enviado para seu e-mail.');
    }

    user.email_verified = true;
    user.confirmation_code = undefined;
    user.confirmation_token = undefined;

    this.addAudit({
      entity_type: 'user',
      entity_id: user.email,
      action: 'UPDATE',
      details: `Cadastro do operador ${user.name} (${user.email}) confirmado e ativado com sucesso via validação de e-mail institucional.`,
      changed_by: actorEmail,
      user_role: 'operator',
    });

    this.saveToStorage(this.data);
    return user;
  }

  public resendConfirmationEmail(email: string, actorEmail: string = 'Sistema IPME'): { success: boolean; code: string; token: string; email: string; name: string } {
    const emailNorm = (email || '').trim().toLowerCase();
    const user = this.data.users.find(u => u.email.toLowerCase() === emailNorm);
    if (!user) {
      throw new Error(`Operador com o e-mail "${email}" não encontrado.`);
    }

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const confirmationToken = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    user.confirmation_code = confirmationCode;
    user.confirmation_token = confirmationToken;
    user.confirmation_sent_at = now;
    user.email_verified = false;

    this.addAudit({
      entity_type: 'user',
      entity_id: user.email,
      action: 'UPDATE',
      details: `Novo e-mail institucional de confirmação de cadastro despachado para ${user.name} (${user.email}) com código ${confirmationCode}.`,
      changed_by: actorEmail,
      user_role: 'admin',
    });

    this.saveToStorage(this.data);
    return {
      success: true,
      code: confirmationCode,
      token: confirmationToken,
      email: user.email,
      name: user.name,
    };
  }

  public changePassword(email: string, currentPass: string, newPass: string, actorEmail?: string): AppUser {
    const emailNorm = (email || '').trim().toLowerCase();
    const user = this.data.users.find(u => u.email.toLowerCase() === emailNorm);
    if (!user) {
      throw new Error(`Usuário "${email}" não encontrado no sistema.`);
    }

    if (!newPass || newPass.trim().length < 6) {
      throw new Error('A nova senha deve possuir no mínimo 6 caracteres.');
    }

    const currentTrim = (currentPass || '').trim();
    const newTrim = newPass.trim();

    if (user.password && user.password !== currentTrim) {
      throw new Error('A senha atual informada está incorreta. Verifique e tente novamente.');
    }

    if (user.password && user.password === newTrim) {
      throw new Error('A nova senha não pode ser idêntica à senha atual.');
    }

    user.password = newTrim;
    user.must_change_password = false;

    this.addAudit({
      entity_type: 'user',
      entity_id: user.email,
      action: 'UPDATE',
      details: `Senha de acesso alterada pelo próprio usuário (${user.name} - ${user.email}).`,
      changed_by: actorEmail || user.email,
      user_role: user.role,
    });

    this.saveToStorage(this.data);
    return user;
  }

  public deleteUser(email: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    if (email.toLowerCase() === 'pliniocatunda@gmail.com') {
      throw new Error('A conta do Administrador Master (pliniocatunda@gmail.com) é permanente e não pode ser excluída.');
    }
    if (actorRole !== 'admin') {
      throw new Error('Apenas o Administrador Master pode excluir operadores.');
    }
    const index = this.data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) throw new Error('Operador não encontrado.');
    const user = this.data.users[index];

    this.data.users.splice(index, 1);
    this.addAudit({
      entity_type: 'user',
      entity_id: email,
      action: 'DELETE',
      details: `Operador ${user.name} (${user.email}) excluído do sistema pelo Administrador Master.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return true;
  }

  public login(email: string, name?: string, provider: 'google' | 'corporate' = 'corporate', password?: string, tenantId?: string): AppUser {
    const emailNorm = email.trim().toLowerCase();
    const isMaster = emailNorm === 'pliniocatunda@gmail.com';
    let user = this.data.users.find(u => u.email.toLowerCase() === emailNorm);

    if (!user) {
      if (isMaster) {
        user = this.saveUser(
          {
            email: 'Pliniocatunda@gmail.com',
            name: name || 'Plínio Catunda (Administrador Master)',
            role: 'admin',
            auth_provider: 'google',
            department: 'IPME - Presidência & Governança',
            cargo: 'Administrador Geral & Master do Sistema',
            ativo: true,
            password: password || 'IpmeMaster@2026',
            email_verified: true,
            must_change_password: false,
            avatar_url: '/src/assets/images/ipme_logo_correto_1792419543135.jpg',
          },
          'Sistema IPME',
          'admin'
        );
      } else {
        throw new Error(
          `O e-mail corporativo "${email}" não está cadastrado. Apenas operadores previamente cadastrados pelo Administrador Master (pliniocatunda@gmail.com) possuem acesso ao sistema.`
        );
      }
    }

    if (user.ativo === false) {
      throw new Error(`O acesso do operador "${user.name}" está inativo. Solicite a reativação ao Administrador Master.`);
    }

    if (provider === 'google') {
      if (!isMaster) {
        throw new Error('Acesso negado. Apenas a conta Google oficial (pliniocatunda@gmail.com) tem permissão de Administrador Master.');
      }
      // Autenticado com sucesso via Google - sem necessidade de senha de sistema!
    } else {
      // Validação obrigatória de senha para operadores corporativos
      const userPassword = user.password || (isMaster ? 'IpmeMaster@2026' : 'Ipme@2026');
      if (!password || !password.trim()) {
        throw new Error('Por favor, informe sua senha de acesso para entrar no sistema.');
      }
      if (userPassword !== password.trim()) {
        throw new Error('Senha de acesso incorreta. Verifique os caracteres e tente novamente.');
      }
    }

    user.email_verified = true;
    user.last_login = new Date().toISOString();
    if (isMaster) {
      user.is_master_admin = true;
    } else {
      if (tenantId) {
        user.tenant_id = user.tenant_id || tenantId;
        this.setActiveTenant(user.tenant_id);
      } else if (user.tenant_id) {
        this.setActiveTenant(user.tenant_id);
      }
    }
    this.saveToStorage(this.data);
    return user;
  }

  public importCadastroCSV(
    csvText: string,
    substituirExistentes: boolean,
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): {
    totalLinhas: number;
    servidoresImportados: number;
    servidoresAtualizados: number;
    secretariasImportadas: number;
    secretariasAtualizadas: number;
    telefonesFormatados: number;
    telefonesIgnorados: number;
    erros: string[];
  } {
    // Dynamic import logic using parser
    const parsed = parseServidoresCSV(csvText);

    if (parsed.erros.length > 0 && parsed.rows.length === 0) {
      throw new Error(`Erro ao processar CSV: ${parsed.erros.join('; ')}`);
    }

    const now = new Date().toISOString();

    // Se solicitado substituição total da base de servidores
    if (substituirExistentes) {
      const totalAntigo = this.data.employees.length;
      const totalLicencasAntigo = this.data.occurrences.length;
      this.data.employees = [];
      this.data.occurrences = [];

      this.addAudit({
        entity_type: 'employee',
        entity_id: 'ALL',
        action: 'DELETE',
        details: `Reset total de servidores e licenças para nova importação CSV. Removidos: ${totalAntigo} servidores e ${totalLicencasAntigo} licenças anteriores.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
    }

    let secretariasImportadas = 0;
    let secretariasAtualizadas = 0;

    // 1. Cadastrar / Atualizar Secretarias
    for (const secItem of parsed.secretarias) {
      if (
        /SEC-\d{3}\.\d{3}\.\d{3}-\d{2}/.test(secItem.id) ||
        /\d{3}\.\d{3}\.\d{3}-\d{2}/.test(secItem.sigla) ||
        /^\d{3}$/.test(secItem.nome)
      ) {
        continue;
      }

      const idx = this.data.secretarias.findIndex(
        s => s.id === secItem.id || s.sigla.toUpperCase() === secItem.sigla.toUpperCase() || s.nome.toLowerCase() === secItem.nome.toLowerCase()
      );

      if (idx >= 0) {
        this.data.secretarias[idx].nome = secItem.nome;
        this.data.secretarias[idx].sigla = secItem.sigla;
        this.data.secretarias[idx].updated_at = now;
        secretariasAtualizadas++;
      } else {
        this.data.secretarias.push({
          id: secItem.id,
          sigla: secItem.sigla,
          nome: secItem.nome,
          ativa: true,
          created_at: now,
          updated_at: now,
          created_by: actorEmail,
        });
        secretariasImportadas++;
      }
    }

    let servidoresImportados = 0;
    let servidoresAtualizados = 0;

    // 2. Cadastrar / Atualizar Servidores
    for (const row of parsed.rows) {
      const idx = this.data.employees.findIndex(e => e.matricula.trim() === row.matricula.trim());
      if (idx >= 0) {
        this.data.employees[idx] = {
          ...this.data.employees[idx],
          nome: row.nome,
          cargo: row.cargo || this.data.employees[idx].cargo,
          telefone: row.telefone || this.data.employees[idx].telefone,
          cpf: row.cpf || this.data.employees[idx].cpf,
          secretaria: row.secretaria_completa,
          data_admissao: row.data_admissao || this.data.employees[idx].data_admissao,
          email: row.email || this.data.employees[idx].email,
          updated_at: now,
        };

        // Sincroniza o cargo nas licenças existentes do servidor para manter prontuários consistentes
        if (row.cargo) {
          this.data.occurrences.forEach(occ => {
            if (occ.matricula.trim() === row.matricula.trim()) {
              occ.employee_cargo = row.cargo;
              occ.employee_nome = row.nome;
              occ.employee_secretaria = row.secretaria_completa;
            }
          });
        }

        servidoresAtualizados++;
      } else {
        this.data.employees.push({
          matricula: row.matricula,
          nome: row.nome,
          cpf: row.cpf,
          telefone: row.telefone,
          secretaria: row.secretaria_completa,
          cargo: row.cargo || 'Servidor Municipal',
          status: 'Ativo',
          data_admissao: row.data_admissao,
          email: row.email,
          created_at: now,
          updated_at: now,
          created_by: actorEmail,
        });
        servidoresImportados++;
      }
    }

    this.addAudit({
      entity_type: 'employee',
      entity_id: 'IMPORT_CSV',
      action: 'CREATE',
      details: `Importação em lote via CSV concluída: ${servidoresImportados} novos servidores inseridos, ${servidoresAtualizados} atualizados, ${secretariasImportadas} secretarias criadas. Telefones formatados: ${parsed.telefonesValidos}, ignorados: ${parsed.telefonesIgnorados}.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToStorage(this.data);

    return {
      totalLinhas: parsed.totalRows,
      servidoresImportados,
      servidoresAtualizados,
      secretariasImportadas,
      secretariasAtualizadas,
      telefonesFormatados: parsed.telefonesValidos,
      telefonesIgnorados: parsed.telefonesIgnorados,
      erros: parsed.erros,
    };
  }
}

export const clientDb = new ClientDatabase();
