import { Employee, Occurrence, Secretaria, Doctor, AuditLog, AppUser, DashboardMetrics } from '../types/index.ts';
import { calcularDiasPagos } from '../utils/validation.ts';

export interface DatabaseSchema {
  employees: Employee[];
  occurrences: Occurrence[];
  secretarias: Secretaria[];
  doctors: Doctor[];
  users: AppUser[];
  audit_logs: AuditLog[];
}

const INITIAL_DATA: DatabaseSchema = {
  employees: [
    {
      matricula: "10",
      nome: "CELSA BEZERRA FERREIRA",
      cpf: "384.921.053-44",
      telefone: "(85) 98822-1010",
      secretaria: "SME - Secretaria Municipal de Educação",
      setor: "Escola Municipal Neusa de Freitas Sá",
      cargo: "PROFESSORA",
      status: "Licenciado",
      data_admissao: "2016-02-15",
      email: "celsa.ferreira@eusebio.ce.gov.br",
      created_at: "2026-09-28T17:36:03.595Z",
      updated_at: "2026-09-28T17:36:03.595Z",
      created_by: "Pliniocatunda@gmail.com"
    },
    {
      matricula: "11",
      nome: "JARIANA BRITO DE ALMEIDA",
      cpf: "592.140.783-12",
      telefone: "(85) 99133-2020",
      secretaria: "SME - Secretaria Municipal de Educação",
      setor: "CEI Maria Tavares de Miranda",
      cargo: "PROFESSORA",
      status: "Licenciado",
      data_admissao: "2018-03-01",
      email: "jariana.almeida@eusebio.ce.gov.br",
      created_at: "2026-09-28T17:37:00.818Z",
      updated_at: "2026-09-28T17:37:00.818Z",
      created_by: "Pliniocatunda@gmail.com"
    },
    {
      matricula: "15",
      nome: "MARIA VALDENIA DA SILVA",
      cpf: "713.849.203-91",
      telefone: "(85) 98744-3030",
      secretaria: "SMS - Secretaria Municipal de Saúde",
      setor: "UBS Novo Portugal",
      cargo: "AGENTE COMUNITARIA",
      status: "Readaptado",
      data_admissao: "2015-08-10",
      email: "valdenia.silva@eusebio.ce.gov.br",
      created_at: "2026-09-28T17:39:25.601Z",
      updated_at: "2026-09-28T17:39:25.601Z",
      created_by: "Pliniocatunda@gmail.com"
    },
    {
      matricula: "20",
      nome: "FRANCISCO CESAR ROSENO DE SOUSA",
      cpf: "628.304.913-80",
      telefone: "(85) 99655-4040",
      secretaria: "SMSPC - Secretaria de Segurança Pública e Cidadania",
      setor: "Guarda Municipal / Operações",
      cargo: "GUARDA MUNICIPAL",
      status: "Licenciado",
      data_admissao: "2013-05-20",
      email: "cesar.sousa@eusebio.ce.gov.br",
      created_at: "2026-09-28T17:40:21.237Z",
      updated_at: "2026-09-29T16:53:17.002Z",
      created_by: "Pliniocatunda@gmail.com"
    },
    {
      matricula: "30",
      nome: "ANTONIO ROBERTO CAVALCANTE",
      cpf: "418.592.033-67",
      telefone: "(85) 99711-5050",
      secretaria: "SEFIN - Secretaria Municipal de Finanças",
      setor: "Coordenação de Arrecadação",
      cargo: "FISCAL DE TRIBUTOS",
      status: "Ativo",
      data_admissao: "2011-04-10",
      email: "roberto.cavalcante@eusebio.ce.gov.br",
      created_at: "2026-09-28T18:00:00.000Z",
      updated_at: "2026-09-28T18:22:39.487Z",
      created_by: "Pliniocatunda@gmail.com"
    }
  ],
  occurrences: [
    {
      id: "1",
      matricula: "10",
      employee_nome: "CELSA BEZERRA FERREIRA",
      employee_cargo: "PROFESSORA",
      employee_secretaria: "SME - Secretaria Municipal de Educação",
      tipo: "Licença Definitiva",
      data_inicio: "2026-08-15",
      data_termino: "2026-10-13",
      data_termino_inicial: "2026-10-13",
      quantidade_dias: 60,
      cid: "F32.1 - Episódio depressivo moderado",
      medico_perito: "Dr. Marcelo Cavalcante Holanda",
      crm: "CRM/CE 14.892",
      status: "Ativa",
      anexo_url: "",
      anexo_nome: "Laudo_Pericial_SME_10.pdf",
      observacoes: "Servidora com sintomas de exaustão e depressão moderada em acompanhamento terapêutico.",
      parecer_tecnico: "Junta Médica Oficial do IPME homologou 60 dias de afastamento integral para acompanhamento psicoterapêutico e farmacológico. Retorno previsto com reavaliação pericial.\n[Conversão em Licença Definitiva em 30/09/2026 por Pliniocatunda@gmail.com]: Licença transformada de \"Licença Saúde\" para \"Licença Definitiva\". Data da Concessão: 2026-10-14 | Ato Concessório: Portaria IPME nº 092/2026. Médico Responsável: Dr. Marcelo Cavalcante Holanda (CRM/CE 14.892). Justificativa: Incapacidade definitiva homologada",
      prorrogacoes: [],
      created_at: "2026-08-15T14:20:00.000Z",
      updated_at: "2026-09-30T18:18:47.663Z",
      created_by: "Pliniocatunda@gmail.com",
      data_concessao: "2026-10-14",
      ato_concessao: "Portaria IPME nº 092/2026",
      motivo_definitiva: "Incapacidade definitiva homologada",
      data_conversao: "2026-09-30T18:18:47.663Z"
    },
    {
      id: "2",
      matricula: "11",
      employee_nome: "JARIANA BRITO DE ALMEIDA",
      employee_cargo: "PROFESSORA",
      employee_secretaria: "SME - Secretaria Municipal de Educação",
      tipo: "Licença Maternidade",
      data_inicio: "2026-08-01",
      data_termino: "2027-01-27",
      data_termino_inicial: "2027-01-27",
      quantidade_dias: 180,
      cid: "O80 - Parto único espontâneo (Licença Maternidade)",
      medico_perito: "Dra. Juliana Vasconcelos Pontes",
      crm: "CRM/CE 18.234",
      status: "Ativa",
      anexo_url: "",
      anexo_nome: "Certidao_Nascimento_Amadeu_Sa_11.pdf",
      observacoes: "Parto realizado no Hospital Maternidade Amadeu Sá em Eusébio - CE.",
      parecer_tecnico: "Homologação de Licença Maternidade pelo período integral de 180 (cento e oitenta) dias à servidora municipal, nos termos da legislação municipal e do Programa Servidora Cidadã.",
      prorrogacoes: [],
      created_at: "2026-08-01T10:00:00.000Z",
      updated_at: "2026-08-01T10:00:00.000Z",
      created_by: "Pliniocatunda@gmail.com"
    },
    {
      id: "3",
      matricula: "15",
      employee_nome: "MARIA VALDENIA DA SILVA",
      employee_cargo: "AGENTE COMUNITARIA",
      employee_secretaria: "SMS - Secretaria Municipal de Saúde",
      tipo: "Readaptação",
      data_inicio: "2026-06-01",
      data_termino: "2026-11-27",
      data_termino_inicial: "2026-11-27",
      quantidade_dias: 180,
      cid: "M65.8 - Outras sinovites e tenossinovites (LER/DORT)",
      medico_perito: "Dra. Camila Nogueira Dantas",
      crm: "CRM/CE 21.089",
      status: "Ativa",
      anexo_url: "",
      anexo_nome: "Laudo_Readaptacao_SMS_15.pdf",
      observacoes: "Impossibilitada de longas caminhadas sob calor e esforço biomecânico repetitivo.",
      parecer_tecnico: "Parecer pericial favorável à readaptação funcional temporária por 180 dias na recepção e arquivamento eletrônico da UBS Novo Portugal, sem esforço de membros superiores com peso acima de 2kg.",
      prorrogacoes: [],
      created_at: "2026-06-01T09:30:00.000Z",
      updated_at: "2026-06-01T09:30:00.000Z",
      created_by: "Pliniocatunda@gmail.com"
    },
    {
      id: "4",
      matricula: "20",
      employee_nome: "FRANCISCO CESAR ROSENO DE SOUSA",
      employee_cargo: "GUARDA MUNICIPAL",
      employee_secretaria: "SMSPC - Secretaria de Segurança Pública e Cidadania",
      tipo: "Licença Definitiva",
      data_inicio: "2026-07-01",
      data_termino: "2026-10-29",
      data_termino_inicial: "2026-09-29",
      quantidade_dias: 121,
      cid: "",
      medico_perito: "Dr. Marcelo Cavalcante Holanda",
      crm: "CRM/CE 14.892",
      status: "Ativa",
      anexo_url: "",
      anexo_nome: "",
      observacoes: "",
      parecer_tecnico: "\n[1ª Prorrogação em 29/09/2026 por Pliniocatunda@gmail.com]: Data de término estendida de 2026-09-29 para 2026-10-29 (+30 dias, total 121d). Perito: Dra. Juliana Vasconcelos Pontes (CRM/CE 18.234). Motivo: Necessidade de continuidade do tratamento médico prescrito com reavaliação clínica.\n[Conversão em Licença Definitiva em 30/09/2026 por Pliniocatunda@gmail.com]: Licença transformada de \"Licença Saúde\" para \"Licença Definitiva\". Data da Concessão: 2026-10-30 | Ato Concessório: Portaria IPME nº 088/2026. Médico Responsável: Dr. Marcelo Cavalcante Holanda (CRM/CE 14.892). Justificativa: Incapacidade laborativa definitiva e permanente homologada por Junta Médica Oficial | Parecer Conclusivo: Atestamos que o servidor apresenta incapacidade definitiva e irreversível.",
      prorrogacoes: [
        {
          id: "PRORR-4-1",
          sequencial: 1,
          data_anterior_termino: "2026-09-29",
          nova_data_termino: "2026-10-29",
          dias_adicionados: 30,
          dias_totais_acumulados: 121,
          dias_pagos_acumulados: 106,
          motivo: "Necessidade de continuidade do tratamento médico prescrito com reavaliação clínica.",
          medico_perito: "Dra. Juliana Vasconcelos Pontes",
          crm: "CRM/CE 18.234",
          created_at: "2026-09-29T16:55:55.971Z",
          created_by: "Pliniocatunda@gmail.com"
        }
      ],
      created_at: "2026-09-29T16:53:17.002Z",
      updated_at: "2026-09-30T18:02:52.970Z",
      created_by: "Pliniocatunda@gmail.com",
      data_concessao: "2026-10-30",
      ato_concessao: "Portaria IPME nº 088/2026",
      motivo_definitiva: "Incapacidade laborativa definitiva e permanente homologada por Junta Médica Oficial",
      data_conversao: "2026-09-30T18:02:52.970Z"
    }
  ],
  audit_logs: [
    {
      id: "audit_1790792327671_13nx",
      timestamp: "2026-09-30T18:18:47.671Z",
      entity_type: "occurrence",
      entity_id: "1",
      action: "CONVERTER_DEFINITIVA",
      details: "Ocorrência Nº 1 do servidor CELSA BEZERRA FERREIRA convertida em Licença Definitiva. Data de Concessão: 2026-10-14. Ato: Portaria IPME nº 092/2026.",
      changed_by: "Pliniocatunda@gmail.com",
      user_role: "admin",
      diff: {
        before: { tipo: "Licença Saúde" },
        after: { tipo: "Licença Definitiva", data_concessao: "2026-10-14", ato_concessao: "Portaria IPME nº 092/2026" }
      }
    },
    {
      id: "audit_1790791373041_n7xq",
      timestamp: "2026-09-30T18:02:53.041Z",
      entity_type: "occurrence",
      entity_id: "4",
      action: "CONVERTER_DEFINITIVA",
      details: "Ocorrência Nº 4 do servidor FRANCISCO CESAR ROSENO DE SOUSA convertida em Licença Definitiva. Data de Concessão: 2026-10-30. Ato: Portaria IPME nº 088/2026.",
      changed_by: "Pliniocatunda@gmail.com",
      user_role: "admin",
      diff: {
        before: { tipo: "Licença Saúde" },
        after: { tipo: "Licença Definitiva", data_concessao: "2026-10-30", ato_concessao: "Portaria IPME nº 088/2026" }
      }
    }
  ],
  users: [
    {
      id: "user_master_admin",
      email: "Pliniocatunda@gmail.com",
      name: "Plínio Catunda",
      role: "admin",
      auth_provider: "google",
      department: "IPME - Presidência & Governança",
      avatar_url: "/src/assets/images/ipme_seal_logo_1790337165041.jpg",
      created_at: "2026-01-01T08:00:00.000Z"
    },
    {
      id: "user_perito_medico",
      email: "medico.perito@eusebio.ce.gov.br",
      name: "Dr. Marcelo Cavalcante Holanda",
      role: "operator",
      auth_provider: "corporate",
      department: "IPME - Junta Médica Pericial",
      avatar_url: "/src/assets/images/avatar_perito_1790337176942.jpg",
      created_at: "2026-01-15T09:30:00.000Z"
    },
    {
      id: "user_rh_operador",
      email: "rh.operador@eusebio.ce.gov.br",
      name: "Mariana Vasconcelos de Albuquerque",
      role: "operator",
      auth_provider: "corporate",
      department: "SME / IPME - Recursos Humanos & Benefícios",
      created_at: "2026-02-01T10:00:00.000Z"
    }
  ],
  secretarias: [
    {
      id: "SEC-SME",
      sigla: "SME",
      nome: "Secretaria Municipal de Educação",
      secretario: "Profa. Josete Maria de Holanda",
      email: "educacao@eusebio.ce.gov.br",
      telefone: "(85) 3260-1510",
      endereco: "Rua Irmã Ambrosina, 260 - Centro, Eusébio - CE",
      ativa: true,
      created_at: "2026-01-01T08:00:00.000Z",
      updated_at: "2026-01-01T08:00:00.000Z",
      created_by: "Sistema IPME"
    },
    {
      id: "SEC-SMS",
      sigla: "SMS",
      nome: "Secretaria Municipal de Saúde",
      secretario: "Dr. Josué de Castro",
      email: "saude@eusebio.ce.gov.br",
      telefone: "(85) 3260-1920",
      endereco: "Av. Eduardo Sá, 150 - Urucunema, Eusébio - CE",
      ativa: true,
      created_at: "2026-01-01T08:00:00.000Z",
      updated_at: "2026-01-01T08:00:00.000Z",
      created_by: "Sistema IPME"
    },
    {
      id: "SEC-SEFIN",
      sigla: "SEFIN",
      nome: "Secretaria Municipal de Finanças",
      secretario: "Alexandre Cordeiro Maia",
      email: "financas@eusebio.ce.gov.br",
      telefone: "(85) 3260-2200",
      endereco: "Rua Prefeito Almir de Freitas, 10 - Centro, Eusébio - CE",
      ativa: true,
      created_at: "2026-01-01T08:00:00.000Z",
      updated_at: "2026-01-01T08:00:00.000Z",
      created_by: "Sistema IPME"
    },
    {
      id: "SEC-SMSPC",
      sigla: "SMSPC",
      nome: "Secretaria de Segurança Pública e Cidadania",
      secretario: "Cel. Lauro Prado",
      email: "seguranca@eusebio.ce.gov.br",
      telefone: "(85) 3260-6600",
      endereco: "Av. Eusébio de Queiroz, 2400 - Tamatanduba, Eusébio - CE",
      ativa: true,
      created_at: "2026-01-01T08:00:00.000Z",
      updated_at: "2026-01-01T08:00:00.000Z",
      created_by: "Sistema IPME"
    },
    {
      id: "SEC-IPME",
      sigla: "IPME",
      nome: "Instituto de Previdência do Município de Eusébio",
      secretario: "Diretoria Executiva Previdenciária",
      email: "atendimento@ipme.ce.gov.br",
      telefone: "(85) 3260-9900",
      endereco: "Rua Irmã Ambrosina, 85 - Centro, Eusébio - CE",
      ativa: true,
      created_at: "2026-01-01T08:00:00.000Z",
      updated_at: "2026-01-01T08:00:00.000Z",
      created_by: "Sistema IPME"
    }
  ],
  doctors: [
    {
      id: "1",
      nome: "Dr. Marcelo Cavalcante Holanda",
      crm: "CRM/CE 14.892",
      especialidade: "Medicina do Trabalho / Perícia Médica Oficial",
      ativo: true,
      created_at: "2026-01-01T08:00:00.000Z",
      updated_at: "2026-09-29T17:49:23.288Z",
      created_by: "Pliniocatunda@gmail.com",
      vinculo: "Efetivo",
      is_diretor: true
    },
    {
      id: "2",
      nome: "Dra. Juliana Vasconcelos Pontes",
      crm: "CRM/CE 18.234",
      especialidade: "Clínica Médica / Perícia Previdenciária",
      ativo: true,
      created_at: "2026-01-05T09:00:00.000Z",
      updated_at: "2026-09-29T17:49:16.988Z",
      created_by: "Pliniocatunda@gmail.com",
      vinculo: "Comissionado",
      is_diretor: false
    },
    {
      id: "3",
      nome: "Dr. Roberto Mendes Sampaio",
      crm: "CRM/CE 12.450",
      especialidade: "Ortopedia e Traumatologia",
      ativo: true,
      created_at: "2026-01-10T10:00:00.000Z",
      updated_at: "2026-01-10T10:00:00.000Z",
      created_by: "Pliniocatunda@gmail.com",
      vinculo: "Efetivo",
      is_diretor: false
    },
    {
      id: "4",
      nome: "Dra. Camila Nogueira Dantas",
      crm: "CRM/CE 21.089",
      especialidade: "Psiquiatria Ocupacional",
      ativo: true,
      created_at: "2026-01-15T14:30:00.000Z",
      updated_at: "2026-01-15T14:30:00.000Z",
      created_by: "Pliniocatunda@gmail.com",
      vinculo: "Temporário",
      is_diretor: false
    }
  ]
};

const STORAGE_KEY = 'ipme_browser_db_v2';

export class ClientDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    if (typeof window === 'undefined') return INITIAL_DATA;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.employees && parsed.occurrences) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler localStorage IPME, usando dados iniciais:', e);
    }
    this.saveToStorage(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  private saveToStorage(data: DatabaseSchema) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Erro ao salvar no localStorage IPME:', e);
    }
  }

  private addAudit(entry: {
    entity_type: 'employee' | 'occurrence' | 'secretaria' | 'doctor' | 'user';
    entity_id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PRORROGAR' | 'CONCLUIR' | 'CANCELAR' | 'CONVERTER_DEFINITIVA';
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

    let newStatus: 'Ativo' | 'Licenciado' | 'Readaptado' = 'Ativo';

    if (empOccurrences.length > 0) {
      const hasLicense = empOccurrences.some(o => o.tipo !== 'Readaptação');
      if (hasLicense) {
        newStatus = 'Licenciado';
      } else {
        newStatus = 'Readaptado';
      }
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
    const servidoresLicenciados = this.data.employees.filter(e => e.status === 'Licenciado').length;
    const servidoresReadaptados = this.data.employees.filter(e => e.status === 'Readaptado').length;

    const activeOccurrences = this.data.occurrences.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada');
    const totalLicencasAtivas = activeOccurrences.filter(o => o.tipo !== 'Readaptação').length;
    const totalReadaptacoesAtivas = activeOccurrences.filter(o => o.tipo === 'Readaptação').length;

    const totalDiasAfastamentoAcumulados = activeOccurrences.reduce((acc, curr) => acc + (curr.quantidade_dias || 0), 0);
    const totalDiasPagosPeloMunicipio = activeOccurrences.reduce((acc, curr) => acc + calcularDiasPagos(curr.quantidade_dias || 0), 0);

    const now = new Date();
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
      if (e.status === 'Licenciado') secMap[s].licencas++;
      if (e.status === 'Readaptado') secMap[s].readaptados++;
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
      totalLicencaSaude: servidoresLicenciados,
      totalReadaptados: servidoresReadaptados,
      secretariaBreakdown,
      leaveTypeBreakdown,
      recentOccurrences,
      expiringSoon,
    };
  }

  // --- Employees ---
  public getEmployees(search?: string, secretaria?: string, status?: string): Employee[] {
    let result = [...this.data.employees];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        e => e.nome.toLowerCase().includes(s) || e.matricula.includes(s) || e.cpf.includes(s) || e.cargo.toLowerCase().includes(s)
      );
    }
    if (secretaria) {
      result = result.filter(e => e.secretaria.toLowerCase().includes(secretaria.toLowerCase()));
    }
    if (status) {
      result = result.filter(e => e.status === status);
    }
    return result;
  }

  public getEmployeeByMatricula(matricula: string): Employee | undefined {
    return this.data.employees.find(e => e.matricula === matricula);
  }

  public saveEmployee(empData: Partial<Employee>, actorEmail: string, actorRole: 'admin' | 'operator'): Employee {
    const existingIndex = this.data.employees.findIndex(e => e.matricula === empData.matricula);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const old = this.data.employees[existingIndex];
      const updated: Employee = {
        ...old,
        ...empData,
        updated_at: now,
      } as Employee;
      this.data.employees[existingIndex] = updated;
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
      const newEmp: Employee = {
        matricula: empData.matricula || String(Date.now()).slice(-4),
        nome: empData.nome || '',
        cpf: empData.cpf || '',
        telefone: empData.telefone || '',
        secretaria: empData.secretaria || 'SME - Secretaria Municipal de Educação',
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

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
        employee_secretaria: emp.secretaria,
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

  public concluirOccurrence(id: string, parecerFinal: string, actorEmail: string, actorRole: 'admin' | 'operator'): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    const now = new Date().toISOString();
    occ.status = 'Concluída';
    occ.updated_at = now;
    if (parecerFinal) {
      occ.parecer_tecnico = (occ.parecer_tecnico ? occ.parecer_tecnico + '\n' : '') + `[Conclusão Pericial em ${new Date().toLocaleDateString('pt-BR')} por ${actorEmail}]: ${parecerFinal}`;
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
    return [...this.data.secretarias];
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

  public deleteDoctor(crm: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    const index = this.data.doctors.findIndex(d => d.crm === crm);
    if (index === -1) throw new Error('Médico não encontrado.');
    const doc = this.data.doctors[index];

    this.data.doctors.splice(index, 1);
    this.addAudit({
      entity_type: 'doctor',
      entity_id: crm,
      action: 'DELETE',
      details: `Médico ${doc.nome} (${doc.crm}) excluído do sistema IPME.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return true;
  }

  public toggleDoctorStatus(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): Doctor {
    const doc = this.data.doctors.find(d => d.id === id || d.crm === id);
    if (!doc) throw new Error('Médico não encontrado.');
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

  public setDoctorDiretor(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): Doctor {
    const doc = this.data.doctors.find(d => d.id === id || d.crm === id);
    if (!doc) throw new Error('Médico não encontrado.');
    for (const d of this.data.doctors) {
      d.is_diretor = false;
    }
    doc.is_diretor = true;
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

  public saveUser(userData: Partial<AppUser>, actorEmail: string, actorRole: 'admin' | 'operator'): AppUser {
    const now = new Date().toISOString();
    const existingIndex = this.data.users.findIndex(u => u.email.toLowerCase() === userData.email?.toLowerCase());

    if (existingIndex >= 0) {
      const updated: AppUser = {
        ...this.data.users[existingIndex],
        ...userData,
      } as AppUser;
      this.data.users[existingIndex] = updated;
      this.addAudit({
        entity_type: 'user',
        entity_id: updated.email,
        action: 'UPDATE',
        details: `Usuário ${updated.name} (${updated.email}) atualizado. Perfil: ${updated.role}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return updated;
    } else {
      const newUser: AppUser = {
        id: userData.id || `user_${Date.now()}`,
        email: userData.email || '',
        name: userData.name || userData.email?.split('@')[0] || 'Usuário IPME',
        role: userData.role || 'operator',
        auth_provider: userData.auth_provider || 'corporate',
        department: userData.department || 'Prefeitura Municipal de Eusébio',
        avatar_url: userData.avatar_url || '',
        created_at: now,
      };
      this.data.users.push(newUser);
      this.addAudit({
        entity_type: 'user',
        entity_id: newUser.email,
        action: 'CREATE',
        details: `Novo usuário de sistema cadastrado: ${newUser.name} (${newUser.email}). Perfil: ${newUser.role}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });
      this.saveToStorage(this.data);
      return newUser;
    }
  }

  public deleteUser(email: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    if (email.toLowerCase() === 'pliniocatunda@gmail.com') {
      throw new Error('O usuário Administrador Master não pode ser excluído.');
    }
    const index = this.data.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) throw new Error('Usuário não encontrado.');
    const user = this.data.users[index];

    this.data.users.splice(index, 1);
    this.addAudit({
      entity_type: 'user',
      entity_id: email,
      action: 'DELETE',
      details: `Usuário ${user.name} (${user.email}) excluído do sistema.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToStorage(this.data);
    return true;
  }

  public login(email: string, name?: string, provider: 'google' | 'corporate' = 'corporate'): AppUser {
    let user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      const isMaster = email.toLowerCase() === 'pliniocatunda@gmail.com';
      const role = isMaster ? 'admin' : 'operator';
      user = this.saveUser(
        {
          email,
          name: name || (isMaster ? 'Plínio Catunda (Admin Master)' : email.split('@')[0]),
          role,
          auth_provider: provider,
          department: isMaster ? 'IPME Presidência & Governança' : 'Prefeitura Municipal de Eusébio',
          avatar_url: isMaster ? '/src/assets/images/ipme_seal_logo_1790337165041.jpg' : undefined,
        },
        'Sistema IPME',
        'admin'
      );
    }
    return user;
  }
}

export const clientDb = new ClientDatabase();
