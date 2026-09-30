import { Employee, Occurrence, AuditLog, AppUser, DashboardMetrics, Secretaria, Doctor } from '../types/index.ts';

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

  public async getStats(): Promise<DashboardMetrics> {
    const res = await fetch('/api/stats', { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getEmployees(search?: string, secretaria?: string, status?: string): Promise<Employee[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (secretaria) params.append('secretaria', secretaria);
    if (status) params.append('status', status);

    const res = await fetch(`/api/employees?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getEmployee(matricula: string): Promise<Employee & { history: Occurrence[] }> {
    const res = await fetch(`/api/employees/${matricula}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async createEmployee(emp: Partial<Employee>): Promise<Employee> {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...emp, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getEmployeeByMatricula(matricula: string): Promise<Employee & { history?: Occurrence[] }> {
    const res = await fetch(`/api/employees/${matricula}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async updateEmployee(matricula: string, emp: Partial<Employee>): Promise<Employee> {
    const res = await fetch(`/api/employees/${matricula}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...emp, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async deleteEmployee(matricula: string): Promise<boolean> {
    const res = await fetch(`/api/employees/${matricula}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return true;
  }

  public async getOccurrences(matricula?: string, tipo?: string, status?: string, dataInicio?: string, dataTermino?: string): Promise<Occurrence[]> {
    const params = new URLSearchParams();
    if (matricula) params.append('matricula', matricula);
    if (tipo) params.append('tipo', tipo);
    if (status) params.append('status', status);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataTermino) params.append('dataTermino', dataTermino);

    const res = await fetch(`/api/occurrences?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getOccurrence(id: string): Promise<Occurrence> {
    const res = await fetch(`/api/occurrences/${id}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async createOccurrence(occ: Partial<Occurrence>): Promise<Occurrence> {
    const res = await fetch('/api/occurrences', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...occ, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async updateOccurrence(id: string, occ: Partial<Occurrence>): Promise<Occurrence> {
    const res = await fetch(`/api/occurrences/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...occ, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async prorrogarOccurrence(id: string, data: { novaDataTermino: string; motivo: string; medico?: string; crm?: string }): Promise<Occurrence> {
    const res = await fetch(`/api/occurrences/${id}/prorrogar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...data, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async concluirOccurrence(id: string, parecerFinal: string): Promise<Occurrence> {
    const res = await fetch(`/api/occurrences/${id}/concluir`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ parecerFinal, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async converterOccurrenceDefinitiva(
    id: string,
    data: { dataConcessao: string; atoConcessao?: string; motivo?: string; medico?: string; crm?: string; parecerTecnico?: string }
  ): Promise<Occurrence> {
    const res = await fetch(`/api/occurrences/${id}/converter-definitiva`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...data, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async cancelarOccurrence(id: string, motivo: string): Promise<Occurrence> {
    const res = await fetch(`/api/occurrences/${id}/cancelar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ motivo, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async deleteOccurrence(id: string): Promise<boolean> {
    const res = await fetch(`/api/occurrences/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return true;
  }

  public async clearOccurrences(): Promise<{ deletedOccurrences: number }> {
    const res = await fetch('/api/admin/clear-occurrences', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getAuditLogs(entityType?: string, search?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (search) params.append('search', search);

    const res = await fetch(`/api/audit-logs?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getUsers(): Promise<AppUser[]> {
    const res = await fetch('/api/users', { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getSecretarias(search?: string, apenasAtivas?: boolean): Promise<Secretaria[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (apenasAtivas) params.append('apenasAtivas', 'true');

    const res = await fetch(`/api/secretarias?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getSecretaria(id: string): Promise<Secretaria> {
    const res = await fetch(`/api/secretarias/${id}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async createSecretaria(sec: Partial<Secretaria>): Promise<Secretaria> {
    const res = await fetch('/api/secretarias', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...sec, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async updateSecretaria(id: string, sec: Partial<Secretaria>): Promise<Secretaria> {
    const res = await fetch(`/api/secretarias/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...sec, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async deleteSecretaria(id: string): Promise<boolean> {
    const res = await fetch(`/api/secretarias/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return true;
  }

  // Doctors
  public async getDoctors(search?: string, apenasAtivos?: boolean): Promise<Doctor[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (apenasAtivos !== undefined) params.append('apenasAtivos', String(apenasAtivos));

    const res = await fetch(`/api/doctors?${params.toString()}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async getDoctor(id: string): Promise<Doctor> {
    const res = await fetch(`/api/doctors/${id}`, { headers: this.getHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async createDoctor(doc: Partial<Doctor>): Promise<Doctor> {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...doc, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async updateDoctor(id: string, doc: Partial<Doctor>): Promise<Doctor> {
    const res = await fetch(`/api/doctors/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...doc, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async toggleDoctorStatus(id: string): Promise<Doctor> {
    const res = await fetch(`/api/doctors/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async setDoctorDiretor(id: string): Promise<Doctor> {
    const res = await fetch(`/api/doctors/${id}/set-diretor`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async deleteDoctor(id: string): Promise<boolean> {
    const res = await fetch(`/api/doctors/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      body: JSON.stringify({ actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return true;
  }

  public async saveUser(user: Partial<AppUser>): Promise<AppUser> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...user, actorEmail: this.currentUser.email, actorRole: this.currentUser.role }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    return json.data;
  }

  public async login(email: string, name?: string, provider: 'google' | 'corporate' = 'corporate'): Promise<AppUser> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, provider }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    this.setCurrentUser(json.data);
    return json.data;
  }
}

export const api = new ApiService();
