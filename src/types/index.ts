export type EmployeeStatus = 'Ativo' | 'Licenciado' | 'Readaptado';

export type OccurrenceType = 'Licença Saúde' | 'Readaptação' | 'Licença Definitiva' | 'Licença Maternidade';

export type OccurrenceStatus = 'Ativa' | 'Concluída' | 'Prorrogada' | 'Cancelada';

export type UserRole = 'admin' | 'operator';

export type DoctorVinculo = 'Efetivo' | 'Comissionado' | 'Temporário';

export interface Doctor {
  id: string;
  nome: string;
  crm: string;
  especialidade?: string;
  vinculo?: DoctorVinculo;
  is_diretor?: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Secretaria {
  id: string;
  sigla: string;
  nome: string;
  secretario?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativa: boolean;
  servidores_count?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Employee {
  matricula: string;
  nome: string;
  cpf: string;
  telefone: string;
  secretaria: string;
  setor?: string;
  cargo: string;
  status: EmployeeStatus;
  data_admissao?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ExtensionRecord {
  id: string;
  sequencial: number;
  data_anterior_termino: string;
  nova_data_termino: string;
  dias_adicionados: number;
  dias_totais_acumulados: number;
  dias_pagos_acumulados: number;
  motivo: string;
  medico_perito: string;
  crm: string;
  created_at: string;
  created_by: string;
}

export interface Occurrence {
  id: string;
  matricula: string;
  employee_nome?: string;
  employee_cargo?: string;
  employee_secretaria?: string;
  tipo: OccurrenceType;
  data_inicio: string;
  data_termino: string;
  data_termino_inicial?: string;
  data_concessao?: string;
  ato_concessao?: string;
  motivo_definitiva?: string;
  data_conversao?: string;
  quantidade_dias: number;
  cid?: string;
  medico_perito: string;
  crm: string;
  status: OccurrenceStatus;
  anexo_url?: string;
  anexo_nome?: string;
  observacoes: string;
  parecer_tecnico?: string;
  prorrogacoes?: ExtensionRecord[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AuditLog {
  id: string;
  entity_type: 'employee' | 'occurrence' | 'user' | 'secretaria' | 'doctor';
  entity_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRORROGAR' | 'CONCLUIR' | 'CANCELAR' | 'CONVERTER_DEFINITIVA';
  details: string;
  changed_by: string;
  user_role: UserRole;
  timestamp: string;
  diff?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  auth_provider: 'google' | 'corporate';
  department: string;
  avatar_url?: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  totalAtivos: number;
  totalLicencaSaude: number;
  totalReadaptados: number;
  recentOccurrences: Occurrence[];
  expiringSoon: Occurrence[];
  secretariaBreakdown: { secretaria: string; count: number; licencaCount: number; readaptadoCount: number }[];
  leaveTypeBreakdown: { name: string; value: number }[];
}
