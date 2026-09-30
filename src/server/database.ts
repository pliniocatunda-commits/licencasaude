import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Employee, Occurrence, OccurrenceType, AuditLog, AppUser, DashboardMetrics, Secretaria, Doctor, DoctorVinculo } from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'ipme_database.json');

interface DatabaseSchema {
  employees: Employee[];
  occurrences: Occurrence[];
  audit_logs: AuditLog[];
  users: AppUser[];
  secretarias: Secretaria[];
  doctors: Doctor[];
}

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user_master_admin',
    email: 'Pliniocatunda@gmail.com',
    name: 'Plínio Catunda',
    role: 'admin',
    auth_provider: 'google',
    department: 'IPME - Presidência & Governança',
    avatar_url: '/src/assets/images/ipme_seal_logo_1790337165041.jpg',
    created_at: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'user_perito_medico',
    email: 'medico.perito@eusebio.ce.gov.br',
    name: 'Dr. Marcelo Cavalcante Holanda',
    role: 'operator',
    auth_provider: 'corporate',
    department: 'IPME - Junta Médica Pericial',
    avatar_url: '/src/assets/images/avatar_perito_1790337176942.jpg',
    created_at: '2026-01-15T09:30:00.000Z',
  },
  {
    id: 'user_rh_operador',
    email: 'rh.operador@eusebio.ce.gov.br',
    name: 'Mariana Vasconcelos de Albuquerque',
    role: 'operator',
    auth_provider: 'corporate',
    department: 'SME / IPME - Recursos Humanos & Benefícios',
    created_at: '2026-02-01T10:00:00.000Z',
  },
];

const DEFAULT_EMPLOYEES: Employee[] = [
  {
    matricula: 'EUS-01042',
    nome: 'Maria das Graças Alencar',
    cpf: '452.891.033-72',
    telefone: '(85) 98842-1109',
    secretaria: 'SME - Secretaria Municipal de Educação',
    setor: 'Escola Municipal Neusa de Freitas Sá',
    cargo: 'Professor de Educação Básica II',
    status: 'Licenciado',
    data_admissao: '2014-03-10',
    email: 'maria.alencar@eusebio.ce.gov.br',
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-08-15T14:20:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
  {
    matricula: 'EUS-02115',
    nome: 'Francisco Antunes de Oliveira',
    cpf: '619.340.283-91',
    telefone: '(85) 99123-4567',
    secretaria: 'SMS - Secretaria Municipal de Saúde',
    setor: 'Hospital Municipal Amadeu Sá',
    cargo: 'Enfermeiro Plantonista',
    status: 'Licenciado',
    data_admissao: '2016-07-01',
    email: 'francisco.oliveira@eusebio.ce.gov.br',
    created_at: '2026-02-12T09:00:00.000Z',
    updated_at: '2026-09-01T11:15:00.000Z',
    created_by: 'medico.perito@eusebio.ce.gov.br',
  },
  {
    matricula: 'EUS-03089',
    nome: 'Ana Patrícia Gomes da Silva',
    cpf: '832.190.473-50',
    telefone: '(85) 98765-4321',
    secretaria: 'SEFIN - Secretaria Municipal de Finanças',
    setor: 'Coordenação de Arrecadação e IPTU',
    cargo: 'Assistente Administrativo',
    status: 'Readaptado',
    data_admissao: '2018-02-15',
    email: 'ana.silva@eusebio.ce.gov.br',
    created_at: '2026-01-20T11:30:00.000Z',
    updated_at: '2026-07-10T16:45:00.000Z',
    created_by: 'rh.operador@eusebio.ce.gov.br',
  },
  {
    matricula: 'EUS-04192',
    nome: 'José Roberto Cavalcante',
    cpf: '304.782.913-68',
    telefone: '(85) 99654-7890',
    secretaria: 'SMSPC - Secretaria de Segurança Pública e Cidadania',
    setor: 'Guarda Municipal / Ronda Ostensiva Escolar',
    cargo: 'Guarda Municipal 1ª Classe',
    status: 'Readaptado',
    data_admissao: '2012-05-20',
    email: 'roberto.cavalcante@eusebio.ce.gov.br',
    created_at: '2026-01-18T14:10:00.000Z',
    updated_at: '2026-06-05T09:30:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
  {
    matricula: 'EUS-05230',
    nome: 'Raimunda Nonata Bezerra',
    cpf: '571.209.833-44',
    telefone: '(85) 98456-1234',
    secretaria: 'SMS - Secretaria Municipal de Saúde',
    setor: 'UBS Novo Portugal',
    cargo: 'Agente Comunitário de Saúde',
    status: 'Ativo',
    data_admissao: '2015-11-03',
    email: 'nonata.bezerra@eusebio.ce.gov.br',
    created_at: '2026-02-05T08:45:00.000Z',
    updated_at: '2026-02-05T08:45:00.000Z',
    created_by: 'rh.operador@eusebio.ce.gov.br',
  },
  {
    matricula: 'EUS-06114',
    nome: 'Carlos Eduardo de Sousa',
    cpf: '728.940.163-15',
    telefone: '(85) 99789-3210',
    secretaria: 'SMS - Secretaria Municipal de Saúde',
    setor: 'Central de Transporte Sanitário',
    cargo: 'Motorista de Ambulância',
    status: 'Ativo',
    data_admissao: '2019-09-16',
    email: 'carlos.sousa@eusebio.ce.gov.br',
    created_at: '2026-02-18T13:20:00.000Z',
    updated_at: '2026-08-30T10:15:00.000Z',
    created_by: 'medico.perito@eusebio.ce.gov.br',
  },
  {
    matricula: 'EUS-07340',
    nome: 'Sandra Helena Pinheiro',
    cpf: '190.543.823-26',
    telefone: '(85) 98822-9900',
    secretaria: 'SMS - Secretaria Municipal de Saúde',
    setor: 'CAPS II Eusébio',
    cargo: 'Técnica em Enfermagem',
    status: 'Ativo',
    data_admissao: '2020-01-10',
    email: 'sandra.pinheiro@eusebio.ce.gov.br',
    created_at: '2026-03-01T09:10:00.000Z',
    updated_at: '2026-03-01T09:10:00.000Z',
    created_by: 'rh.operador@eusebio.ce.gov.br',
  },
  {
    matricula: 'EUS-08422',
    nome: 'Antônio Marcos Furtado',
    cpf: '921.408.373-85',
    telefone: '(85) 99111-2233',
    secretaria: 'SEINFRA - Secretaria de Infraestrutura e Obras',
    setor: 'Departamento de Fiscalização Urbana',
    cargo: 'Fiscal de Obras e Posturas',
    status: 'Ativo',
    data_admissao: '2017-04-12',
    email: 'antonio.furtado@eusebio.ce.gov.br',
    created_at: '2026-03-12T15:00:00.000Z',
    updated_at: '2026-03-12T15:00:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
  {
    matricula: 'EUS-09156',
    nome: 'Juliana Ferreira Lima',
    cpf: '243.678.913-02',
    telefone: '(85) 98712-3498',
    secretaria: 'SME - Secretaria Municipal de Educação',
    setor: 'CEI Maria Tavares de Miranda',
    cargo: 'Coordenadora Pedagógica',
    status: 'Ativo',
    data_admissao: '2013-08-01',
    email: 'juliana.lima@eusebio.ce.gov.br',
    created_at: '2026-03-15T11:00:00.000Z',
    updated_at: '2026-03-15T11:00:00.000Z',
    created_by: 'rh.operador@eusebio.ce.gov.br',
  },
  {
    matricula: 'EUS-10287',
    nome: 'Paulo Henrique Mendes',
    cpf: '810.923.453-67',
    telefone: '(85) 99933-7744',
    secretaria: 'IPME - Instituto de Previdência do Município de Eusébio',
    setor: 'Diretoria de Benefícios Previdenciários',
    cargo: 'Analista Previdenciário',
    status: 'Ativo',
    data_admissao: '2021-06-01',
    email: 'paulo.mendes@eusebio.ce.gov.br',
    created_at: '2026-03-20T16:30:00.000Z',
    updated_at: '2026-03-20T16:30:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
];

const DEFAULT_OCCURRENCES: Occurrence[] = [
  {
    id: '1',
    matricula: 'EUS-01042',
    employee_nome: 'Maria das Graças Alencar',
    employee_cargo: 'Professor de Educação Básica II',
    employee_secretaria: 'SME - Secretaria Municipal de Educação',
    tipo: 'Licença Saúde',
    data_inicio: '2026-08-15',
    data_termino: '2026-10-13',
    data_termino_inicial: '2026-10-13',
    quantidade_dias: 60,
    cid: 'F32.1 - Episódio depressivo moderado',
    medico_perito: 'Dr. Marcelo Cavalcante Holanda',
    crm: 'CRM/CE 14.890',
    status: 'Ativa',
    anexo_nome: 'Atestado_Pericia_Oficial_01042.pdf',
    observacoes: 'Servidora apresentou quadro severo de exaustão e depressão moderada decorrente de estresse em sala de aula.',
    parecer_tecnico: 'Junta Médica IPME homologou 60 dias de afastamento integral para tratamento psicoterapêutico e farmacológico. Retorno previsto com reavaliação pericial.',
    prorrogacoes: [],
    created_at: '2026-08-15T14:20:00.000Z',
    updated_at: '2026-08-15T14:20:00.000Z',
    created_by: 'medico.perito@eusebio.ce.gov.br',
  },
  {
    id: '2',
    matricula: 'EUS-02115',
    employee_nome: 'Francisco Antunes de Oliveira',
    employee_cargo: 'Enfermeiro Plantonista',
    employee_secretaria: 'SMS - Secretaria Municipal de Saúde',
    tipo: 'Licença Saúde',
    data_inicio: '2026-07-20',
    data_termino: '2026-10-05',
    data_termino_inicial: '2026-09-02',
    quantidade_dias: 78,
    cid: 'M54.5 - Dor lombar baixa (Lombalgia)',
    medico_perito: 'Dra. Camila Nogueira Dantas',
    crm: 'CRM/CE 19.340',
    status: 'Prorrogada',
    anexo_nome: 'Ressonancia_Lombossacra_02115.pdf',
    observacoes: 'Hérnia de disco L4-L5 incapacitante para movimentação de pacientes em leito hospitalar.',
    parecer_tecnico: 'Licença inicial concedida por 45 dias em 20/07/2026. Prorrogada em 01/09/2026 por mais 33 dias após reavaliação com laudo de ressonância magnética demonstrando compressão radicular ativa.',
    prorrogacoes: [
      {
        id: 'PRORR-2-1',
        sequencial: 1,
        data_anterior_termino: '2026-09-02',
        nova_data_termino: '2026-10-05',
        dias_adicionados: 33,
        dias_totais_acumulados: 78,
        dias_pagos_acumulados: 63,
        motivo: 'Reavaliação pericial com laudo de ressonância magnética demonstrando compressão radicular ativa em L4-L5. Recomendada extensão do repouso e sessões fisioterápicas especializadas.',
        medico_perito: 'Dra. Camila Nogueira Dantas',
        crm: 'CRM/CE 19.340',
        created_at: '2026-09-01T11:15:00.000Z',
        created_by: 'medico.perito@eusebio.ce.gov.br',
      }
    ],
    created_at: '2026-07-20T09:00:00.000Z',
    updated_at: '2026-09-01T11:15:00.000Z',
    created_by: 'medico.perito@eusebio.ce.gov.br',
  },
  {
    id: '3',
    matricula: 'EUS-03089',
    employee_nome: 'Ana Patrícia Gomes da Silva',
    employee_cargo: 'Assistente Administrativo',
    employee_secretaria: 'SEFIN - Secretaria Municipal de Finanças',
    tipo: 'Readaptação',
    data_inicio: '2026-07-10',
    data_termino: '2027-01-06',
    quantidade_dias: 180,
    cid: 'G56.0 - Síndrome do túnel do carpo',
    medico_perito: 'Dr. Roberto Bezerra Filho',
    crm: 'CRM/CE 12.115',
    status: 'Ativa',
    anexo_nome: 'Laudo_Eletroneuromiografia_03089.pdf',
    observacoes: 'Restrição de esforços repetitivos e digitação contínua superior a 2 horas diárias.',
    parecer_tecnico: 'Comissão Especial de Readaptação do IPME definiu remanejamento interno: a servidora foi alocada na recepção ao contribuinte e conferência física de certidões, isenta de digitação ininterrupta.',
    created_at: '2026-07-10T16:45:00.000Z',
    updated_at: '2026-07-10T16:45:00.000Z',
    created_by: 'rh.operador@eusebio.ce.gov.br',
  },
  {
    id: '4',
    matricula: 'EUS-04192',
    employee_nome: 'José Roberto Cavalcante',
    employee_cargo: 'Guarda Municipal 1ª Classe',
    employee_secretaria: 'SMSPC - Secretaria de Segurança Pública e Cidadania',
    tipo: 'Readaptação',
    data_inicio: '2026-06-05',
    data_termino: '2027-06-04',
    quantidade_dias: 365,
    cid: 'M75.1 - Síndrome do manguito rotador',
    medico_perito: 'Dra. Camila Nogueira Dantas',
    crm: 'CRM/CE 19.340',
    status: 'Ativa',
    anexo_nome: 'Laudo_Junta_Medica_Seguranca_04192.pdf',
    observacoes: 'Impossibilitado de realizar rondas externas armadas e carregar colete balístico pesado por mais de 4 horas.',
    parecer_tecnico: 'Parecer favorável à readaptação temporária por 12 meses na Central Integrada de Operações de Segurança (CIOPS Eusébio), operando monitoramento por câmeras de vídeo em ambiente climatizado.',
    created_at: '2026-06-05T09:30:00.000Z',
    updated_at: '2026-06-05T09:30:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
  {
    id: '5',
    matricula: 'EUS-06114',
    employee_nome: 'Carlos Eduardo de Sousa',
    employee_cargo: 'Motorista de Ambulância',
    employee_secretaria: 'SMS - Secretaria Municipal de Saúde',
    tipo: 'Licença Saúde',
    data_inicio: '2026-05-10',
    data_termino: '2026-08-08',
    quantidade_dias: 90,
    cid: 'S52.5 - Fratura da extremidade inferior do rádio',
    medico_perito: 'Dr. Marcelo Cavalcante Holanda',
    crm: 'CRM/CE 14.890',
    status: 'Concluída',
    anexo_nome: 'Alta_Medica_Ortopedia_06114.pdf',
    observacoes: 'Acidente extra-laboral com fratura em punho direito tratada cirurgicamente com placa de titânio.',
    parecer_tecnico: 'Tratamento fisioterápico concluído com sucesso. Perícia de retorno realizada em 08/08/2026 constatou recuperação completa da força e amplitude de movimento. Apto para reassumir direção de viatura de emergência.',
    created_at: '2026-05-10T11:00:00.000Z',
    updated_at: '2026-08-30T10:15:00.000Z',
    created_by: 'medico.perito@eusebio.ce.gov.br',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_001',
    entity_type: 'employee',
    entity_id: 'EUS-01042',
    action: 'UPDATE',
    details: 'Status do servidor alterado de "Ativo" para "Licenciado" devido ao início da Licença Saúde ID 1.',
    changed_by: 'medico.perito@eusebio.ce.gov.br',
    user_role: 'operator',
    timestamp: '2026-08-15T14:20:00.000Z',
  },
  {
    id: 'audit_002',
    entity_type: 'occurrence',
    entity_id: '2',
    action: 'PRORROGAR',
    details: 'Prorrogação de 33 dias homologada pela Dra. Camila Nogueira Dantas para ocorrência ID 2. Novo término: 05/10/2026.',
    changed_by: 'medico.perito@eusebio.ce.gov.br',
    user_role: 'operator',
    timestamp: '2026-09-01T11:15:00.000Z',
  },
  {
    id: 'audit_003',
    entity_type: 'occurrence',
    entity_id: '5',
    action: 'CONCLUIR',
    details: 'Licença médica ID 5 concluída após perícia de retorno. Servidor Carlos Eduardo de Sousa retornou ao status Ativo.',
    changed_by: 'medico.perito@eusebio.ce.gov.br',
    user_role: 'operator',
    timestamp: '2026-08-30T10:15:00.000Z',
  },
  {
    id: 'audit_004',
    entity_type: 'employee',
    entity_id: 'EUS-03089',
    action: 'UPDATE',
    details: 'Servidora Ana Patrícia Gomes da Silva readaptada funcionalmente para atendimento presencial e conferência documental.',
    changed_by: 'rh.operador@eusebio.ce.gov.br',
    user_role: 'operator',
    timestamp: '2026-07-10T16:45:00.000Z',
  },
  {
    id: 'audit_005',
    entity_type: 'user',
    entity_id: 'Pliniocatunda@gmail.com',
    action: 'CREATE',
    details: 'Cadastro e ativação do Superusuário Administrador Geral IPME.',
    changed_by: 'Sistema IPME',
    user_role: 'admin',
    timestamp: '2026-01-01T08:00:00.000Z',
  },
];

const DEFAULT_SECRETARIAS: Secretaria[] = [
  {
    id: 'SEC-SME',
    sigla: 'SME',
    nome: 'Secretaria Municipal de Educação',
    secretario: 'Profa. Josete Maria de Holanda',
    email: 'educacao@eusebio.ce.gov.br',
    telefone: '(85) 3260-1510',
    endereco: 'Rua Irmã Ambrosina, 260 - Centro, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SMS',
    sigla: 'SMS',
    nome: 'Secretaria Municipal de Saúde',
    secretario: 'Dr. Josué de Castro',
    email: 'saude@eusebio.ce.gov.br',
    telefone: '(85) 3260-1920',
    endereco: 'Av. Eduardo Sá, 150 - Urucunema, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SEFIN',
    sigla: 'SEFIN',
    nome: 'Secretaria Municipal de Finanças',
    secretario: 'Alexandre Cordeiro Maia',
    email: 'financas@eusebio.ce.gov.br',
    telefone: '(85) 3260-2200',
    endereco: 'Rua Prefeito Almir de Freitas, 10 - Centro, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SDS',
    sigla: 'SDS',
    nome: 'Secretaria de Desenvolvimento Social',
    secretario: 'Michele Queiroz Rocha',
    email: 'social@eusebio.ce.gov.br',
    telefone: '(85) 3260-3100',
    endereco: 'Rua Carmelita Rebouças, 115 - Centro, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SEINFRA',
    sigla: 'SEINFRA',
    nome: 'Secretaria de Infraestrutura e Obras',
    secretario: 'Eng. Sebastião Albuquerque',
    email: 'obras@eusebio.ce.gov.br',
    telefone: '(85) 3260-4400',
    endereco: 'Rua José Guimarães, 45 - Parque Havaí, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SEAD',
    sigla: 'SEAD',
    nome: 'Secretaria de Administração e Planejamento',
    secretario: 'Rodrigo Medeiros Fonteles',
    email: 'administracao@eusebio.ce.gov.br',
    telefone: '(85) 3260-5500',
    endereco: 'Rua Prefeito Almir de Freitas, 10 - Centro, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SMSPC',
    sigla: 'SMSPC',
    nome: 'Secretaria de Segurança Pública e Cidadania',
    secretario: 'Cel. Lauro Prado',
    email: 'seguranca@eusebio.ce.gov.br',
    telefone: '(85) 3260-6600',
    endereco: 'Av. Eusébio de Queiroz, 2400 - Tamatanduba, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SECULT',
    sigla: 'SECULT',
    nome: 'Secretaria de Cultura e Turismo',
    secretario: 'Tarcísio da Silva Christiane',
    email: 'cultura@eusebio.ce.gov.br',
    telefone: '(85) 3260-7700',
    endereco: 'Av. Eusébio de Queiroz, 460 - Centro, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-SEMA',
    sigla: 'SEMA',
    nome: 'Secretaria de Meio Ambiente e Urbanismo',
    secretario: 'Bárbara Cavalcante Pontes',
    email: 'meioambiente@eusebio.ce.gov.br',
    telefone: '(85) 3260-8800',
    endereco: 'Rua Edmilson Pinheiro, 80 - Autódromo, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-GAB',
    sigla: 'GAB',
    nome: 'Gabinete do Prefeito',
    secretario: 'Chefe de Gabinete',
    email: 'gabinete@eusebio.ce.gov.br',
    telefone: '(85) 3260-1000',
    endereco: 'Rua Prefeito Almir de Freitas, 10 - Centro, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
  {
    id: 'SEC-IPME',
    sigla: 'IPME',
    nome: 'Instituto de Previdência do Município de Eusébio',
    secretario: 'Diretoria Executiva Previdenciária',
    email: 'atendimento@ipme.ce.gov.br',
    telefone: '(85) 3260-9900',
    endereco: 'Rua Irmã Ambrosina, 85 - Centro, Eusébio - CE',
    ativa: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Sistema IPME',
  },
];

const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: '1',
    nome: 'Dr. Marcelo Cavalcante Holanda',
    crm: 'CRM/CE 14.892',
    especialidade: 'Medicina do Trabalho / Perícia Médica Oficial',
    vinculo: 'Efetivo',
    is_diretor: true,
    ativo: true,
    created_at: '2026-01-01T08:00:00.000Z',
    updated_at: '2026-01-01T08:00:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
  {
    id: '2',
    nome: 'Dra. Juliana Vasconcelos Pontes',
    crm: 'CRM/CE 18.234',
    especialidade: 'Clínica Médica / Perícia Previdenciária',
    vinculo: 'Comissionado',
    is_diretor: false,
    ativo: true,
    created_at: '2026-01-05T09:00:00.000Z',
    updated_at: '2026-01-05T09:00:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
  {
    id: '3',
    nome: 'Dr. Roberto Mendes Sampaio',
    crm: 'CRM/CE 12.450',
    especialidade: 'Ortopedia e Traumatologia',
    vinculo: 'Efetivo',
    is_diretor: false,
    ativo: true,
    created_at: '2026-01-10T10:00:00.000Z',
    updated_at: '2026-01-10T10:00:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
  {
    id: '4',
    nome: 'Dra. Camila Nogueira Dantas',
    crm: 'CRM/CE 21.089',
    especialidade: 'Psiquiatria Ocupacional',
    vinculo: 'Temporário',
    is_diretor: false,
    ativo: true,
    created_at: '2026-01-15T14:30:00.000Z',
    updated_at: '2026-01-15T14:30:00.000Z',
    created_by: 'Pliniocatunda@gmail.com',
  },
];

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.employees) && Array.isArray(parsed.occurrences)) {
          if (!parsed.secretarias || !Array.isArray(parsed.secretarias) || parsed.secretarias.length === 0) {
            parsed.secretarias = DEFAULT_SECRETARIAS;
            this.saveToDisk(parsed);
          }

          if (!parsed.doctors || !Array.isArray(parsed.doctors) || parsed.doctors.length === 0) {
            parsed.doctors = DEFAULT_DOCTORS;
            this.saveToDisk(parsed);
          }

          // Normalize any legacy IDs with prefixes (e.g. LIC-2026-0001) to clean sequential numbers
          let needsSave = false;
          let seqCounter = 1;
          const idMap = new Map<string, string>();

          // Normalize doctor IDs to clean sequential numbers (1, 2, 3...)
          if (parsed.doctors && Array.isArray(parsed.doctors)) {
            let docSeq = 1;
            let hasDiretor = parsed.doctors.some((d: Doctor) => d.is_diretor === true);
            for (const doc of parsed.doctors) {
              if (doc.id && (doc.id.includes('DOC-') || isNaN(Number(doc.id)))) {
                const match = doc.id.match(/\d+$/);
                doc.id = match ? String(parseInt(match[0], 10)) : String(docSeq);
                needsSave = true;
              }
              const currentDocNum = parseInt(doc.id, 10);
              if (!isNaN(currentDocNum) && currentDocNum >= docSeq) {
                docSeq = currentDocNum + 1;
              }
              // Migrate vinculo if missing
              if (!doc.vinculo) {
                if (doc.nome?.includes('Juliana')) {
                  doc.vinculo = 'Comissionado';
                } else if (doc.nome?.includes('Camila')) {
                  doc.vinculo = 'Temporário';
                } else {
                  doc.vinculo = 'Efetivo';
                }
                needsSave = true;
              }
              // Migrate is_diretor if missing
              if (doc.is_diretor === undefined) {
                doc.is_diretor = false;
                needsSave = true;
              }
            }
            // Ensure at least one doctor is designated as director
            if (!hasDiretor && parsed.doctors.length > 0) {
              const marcelo = parsed.doctors.find((d: Doctor) => d.nome?.includes('Marcelo')) || parsed.doctors[0];
              marcelo.is_diretor = true;
              needsSave = true;
            }
          }

          for (const occ of parsed.occurrences) {
            if (occ.id && (occ.id.includes('LIC-') || occ.id.includes('READ-') || isNaN(Number(occ.id)))) {
              const oldId = occ.id;
              // Extract numeric portion if available, else sequential counter
              const match = oldId.match(/\d+$/);
              const newId = match ? String(parseInt(match[0], 10)) : String(seqCounter);
              occ.id = newId;
              idMap.set(oldId, newId);
              needsSave = true;
            }
            const currentNum = parseInt(occ.id, 10);
            if (!isNaN(currentNum) && currentNum >= seqCounter) {
              seqCounter = currentNum + 1;
            }

            // Ensure structured extension history fields exist
            if (!occ.prorrogacoes) {
              occ.prorrogacoes = [];
              needsSave = true;
            }
            if (!occ.data_termino_inicial) {
              occ.data_termino_inicial = occ.data_termino;
              needsSave = true;
            }
            // Ensure data_concessao for Licença Definitiva is strictly after data_termino
            if (occ.tipo === 'Licença Definitiva') {
              if (!occ.data_concessao || (occ.data_termino && occ.data_concessao <= occ.data_termino)) {
                const dt = new Date(occ.data_termino + 'T00:00:00');
                dt.setDate(dt.getDate() + 1);
                occ.data_concessao = dt.toISOString().split('T')[0];
                needsSave = true;
              }
            }
          }

          if (idMap.size > 0 && parsed.audit_logs) {
            for (const log of parsed.audit_logs) {
              if (log.entity_type === 'occurrence' && idMap.has(log.entity_id)) {
                log.entity_id = idMap.get(log.entity_id)!;
                needsSave = true;
              }
            }
          }

          if (needsSave) {
            this.saveToDisk(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading database, initializing fresh seed:', e);
    }

    const initial: DatabaseSchema = {
      employees: DEFAULT_EMPLOYEES,
      occurrences: DEFAULT_OCCURRENCES,
      audit_logs: DEFAULT_AUDIT_LOGS,
      users: DEFAULT_USERS,
      secretarias: DEFAULT_SECRETARIAS,
      doctors: DEFAULT_DOCTORS,
    };
    this.saveToDisk(initial);
    return initial;
  }

  private saveToDisk(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error('Error writing database to disk:', e);
    }
  }

  public getEmployees(search?: string, secretaria?: string, status?: string): Employee[] {
    let list = [...this.data.employees];
    if (secretaria && secretaria !== 'ALL') {
      list = list.filter(e => e.secretaria.toLowerCase().includes(secretaria.toLowerCase()));
    }
    if (status && status !== 'ALL') {
      list = list.filter(e => e.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const qClean = q.replace(/\D/g, '');
      list = list.filter(e => {
        const matchMatricula = e.matricula.toLowerCase().includes(q);
        const matchNome = e.nome.toLowerCase().includes(q);
        const matchCpf = qClean && e.cpf.replace(/\D/g, '').includes(qClean);
        const matchCargo = e.cargo.toLowerCase().includes(q);
        return matchMatricula || matchNome || matchCpf || matchCargo;
      });
    }
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  public getEmployeeByMatricula(matricula: string): Employee | undefined {
    return this.data.employees.find(e => e.matricula.toUpperCase() === matricula.toUpperCase());
  }

  public saveEmployee(employee: Partial<Employee> & { matricula: string; nome: string; cpf: string }, actorEmail: string, actorRole: 'admin' | 'operator'): Employee {
    const existingIndex = this.data.employees.findIndex(e => e.matricula.toUpperCase() === employee.matricula.toUpperCase());
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = this.data.employees[existingIndex];
      const updated: Employee = {
        ...existing,
        ...employee,
        matricula: existing.matricula, // immutable PK
        updated_at: now,
      };
      this.data.employees[existingIndex] = updated;

      this.addAuditLog({
        entity_type: 'employee',
        entity_id: updated.matricula,
        action: 'UPDATE',
        details: `Dados do servidor ${updated.nome} (Matrícula: ${updated.matricula}) foram atualizados.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return updated;
    } else {
      const created: Employee = {
        matricula: employee.matricula.trim().toUpperCase(),
        nome: employee.nome.trim(),
        cpf: employee.cpf.trim(),
        telefone: employee.telefone || '',
        secretaria: employee.secretaria || 'SME - Secretaria Municipal de Educação',
        setor: employee.setor || 'Geral',
        cargo: employee.cargo || 'Servidor Municipal',
        status: employee.status || 'Ativo',
        data_admissao: employee.data_admissao || now.split('T')[0],
        email: employee.email || '',
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
      };
      this.data.employees.push(created);

      this.addAuditLog({
        entity_type: 'employee',
        entity_id: created.matricula,
        action: 'CREATE',
        details: `Novo servidor cadastrado: ${created.nome} (${created.matricula}), Cargo: ${created.cargo}, Secretaria: ${created.secretaria}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return created;
    }
  }

  public deleteEmployee(matricula: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    if (actorRole !== 'admin') {
      throw new Error('Apenas Administradores podem excluir cadastros de servidores.');
    }
    const emp = this.getEmployeeByMatricula(matricula);
    if (!emp) return false;

    // Check if there are active occurrences
    const activeOccurrences = this.data.occurrences.filter(
      o => o.matricula.toUpperCase() === matricula.toUpperCase() && (o.status === 'Ativa' || o.status === 'Prorrogada')
    );
    if (activeOccurrences.length > 0) {
      throw new Error(`Não é possível excluir o servidor ${emp.nome} pois existem afastamentos ativos vinculados a ele.`);
    }

    this.data.employees = this.data.employees.filter(e => e.matricula.toUpperCase() !== matricula.toUpperCase());

    this.addAuditLog({
      entity_type: 'employee',
      entity_id: matricula,
      action: 'DELETE',
      details: `Servidor ${emp.nome} (${matricula}) excluído permanentemente pelo administrador.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return true;
  }

  public clearAllEmployees(actorEmail: string, actorRole: 'admin' | 'operator'): { deletedEmployees: number; deletedOccurrences: number } {
    const deletedEmployees = this.data.employees.length;
    const deletedOccurrences = this.data.occurrences.length;

    this.data.employees = [];
    this.data.occurrences = [];

    this.addAuditLog({
      entity_type: 'employee',
      entity_id: 'ALL',
      action: 'DELETE',
      details: `Limpeza geral de cadastro: ${deletedEmployees} servidores e ${deletedOccurrences} ocorrências foram apagados para início de homologação com dados reais.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return { deletedEmployees, deletedOccurrences };
  }

  public getOccurrences(matricula?: string, tipo?: string, status?: string, dataInicio?: string, dataTermino?: string): Occurrence[] {
    let list = [...this.data.occurrences];

    if (matricula && matricula !== 'ALL') {
      list = list.filter(o => o.matricula.toUpperCase() === matricula.toUpperCase());
    }
    if (tipo && tipo !== 'ALL') {
      list = list.filter(o => o.tipo === tipo);
    }
    if (status && status !== 'ALL') {
      list = list.filter(o => o.status === status);
    }
    if (dataInicio) {
      list = list.filter(o => o.data_inicio >= dataInicio);
    }
    if (dataTermino) {
      list = list.filter(o => o.data_termino <= dataTermino);
    }

    // Attach latest employee metadata
    return list
      .map(o => {
        const emp = this.getEmployeeByMatricula(o.matricula);
        return {
          ...o,
          employee_nome: emp ? emp.nome : o.employee_nome,
          employee_cargo: emp ? emp.cargo : o.employee_cargo,
          employee_secretaria: emp ? emp.secretaria : o.employee_secretaria,
        };
      })
      .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));
  }

  public getOccurrenceById(id: string): Occurrence | undefined {
    const occ = this.data.occurrences.find(o => o.id === id);
    if (!occ) return undefined;
    const emp = this.getEmployeeByMatricula(occ.matricula);
    return {
      ...occ,
      employee_nome: emp ? emp.nome : occ.employee_nome,
      employee_cargo: emp ? emp.cargo : occ.employee_cargo,
      employee_secretaria: emp ? emp.secretaria : occ.employee_secretaria,
    };
  }

  public saveOccurrence(occurrenceData: Partial<Occurrence> & { matricula: string; tipo: OccurrenceType; data_inicio: string; data_termino: string }, actorEmail: string, actorRole: 'admin' | 'operator'): Occurrence {
    const employee = this.getEmployeeByMatricula(occurrenceData.matricula);
    if (!employee) {
      throw new Error(`Servidor com matrícula ${occurrenceData.matricula} não encontrado.`);
    }

    const now = new Date().toISOString();
    const days = occurrenceData.quantidade_dias || this.calculateDays(occurrenceData.data_inicio, occurrenceData.data_termino);

    if (occurrenceData.id) {
      // Update
      const index = this.data.occurrences.findIndex(o => o.id === occurrenceData.id);
      if (index === -1) throw new Error('Ocorrência não encontrada.');
      const existing = this.data.occurrences[index];

      if (occurrenceData.tipo === 'Licença Definitiva' && occurrenceData.data_concessao && occurrenceData.data_termino) {
        if (occurrenceData.data_concessao <= occurrenceData.data_termino) {
          throw new Error(`A licença permanente não poderá ser concedida dentro do prazo vigente de licença (término em ${occurrenceData.data_termino}). A Data da Concessão deve ser posterior a essa data.`);
        }
      }

      const updated: Occurrence = {
        ...existing,
        ...occurrenceData,
        quantidade_dias: days,
        employee_nome: employee.nome,
        employee_cargo: employee.cargo,
        employee_secretaria: employee.secretaria,
        updated_at: now,
      };

      this.data.occurrences[index] = updated;
      this.syncEmployeeStatus(employee.matricula);

      this.addAuditLog({
        entity_type: 'occurrence',
        entity_id: updated.id,
        action: 'UPDATE',
        details: `Atualização da ocorrência ${updated.id} (${updated.tipo}) vinculada ao servidor ${employee.nome}. Status: ${updated.status}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return updated;
    } else {
      // Regra de Negócio: Licença Definitiva não pode ser criada diretamente como nova ocorrência
      if (occurrenceData.tipo === 'Licença Definitiva') {
        throw new Error('A Licença Definitiva não pode ser cadastrada diretamente como uma nova ocorrência. Ela deve ser originada a partir da transformação de uma licença já ativa ou prorrogada com a devida Data da Concessão.');
      }

      // Create - Unique sequential numeric ID without prefix
      let maxId = 0;
      for (const o of this.data.occurrences) {
        const num = parseInt(o.id.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
      const nextId = String(maxId + 1);

      const created: Occurrence = {
        id: nextId,
        matricula: employee.matricula,
        employee_nome: employee.nome,
        employee_cargo: employee.cargo,
        employee_secretaria: employee.secretaria,
        tipo: occurrenceData.tipo,
        data_inicio: occurrenceData.data_inicio,
        data_termino: occurrenceData.data_termino,
        data_termino_inicial: occurrenceData.data_termino,
        quantidade_dias: days,
        cid: occurrenceData.cid || '',
        medico_perito: occurrenceData.medico_perito || 'Junta Médica Oficial IPME',
        crm: occurrenceData.crm || 'CRM/CE',
        status: occurrenceData.status || 'Ativa',
        anexo_url: occurrenceData.anexo_url || '',
        anexo_nome: occurrenceData.anexo_nome || '',
        observacoes: occurrenceData.observacoes || '',
        parecer_tecnico: occurrenceData.parecer_tecnico || '',
        prorrogacoes: [],
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
      };

      this.data.occurrences.push(created);
      this.syncEmployeeStatus(employee.matricula);

      this.addAuditLog({
        entity_type: 'occurrence',
        entity_id: created.id,
        action: 'CREATE',
        details: `Novo registro de ${created.tipo} aberto para ${employee.nome} (${employee.matricula}). Período: ${created.data_inicio} até ${created.data_termino} (${created.quantidade_dias} dias).`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return created;
    }
  }

  public prorrogarOccurrence(id: string, novaDataTermino: string, motivo: string, medico: string, crm: string, actorEmail: string, actorRole: 'admin' | 'operator'): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    const oldTermino = occ.data_termino;
    const now = new Date().toISOString();
    const newDays = this.calculateDays(occ.data_inicio, novaDataTermino);

    // Initialise prorrogacoes array if not exists
    if (!occ.prorrogacoes) {
      occ.prorrogacoes = [];
    }
    if (!occ.data_termino_inicial) {
      occ.data_termino_inicial = oldTermino;
    }

    // Calculate added days and new paid days
    const addedDays = Math.max(1, Math.round((new Date(novaDataTermino + 'T12:00:00').getTime() - new Date(oldTermino + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)));
    const diasPagosAcumulados = Math.max(0, newDays - 15);

    const sequencial = occ.prorrogacoes.length + 1;
    const extensionRecord = {
      id: `PRORR-${occ.id}-${sequencial}`,
      sequencial,
      data_anterior_termino: oldTermino,
      nova_data_termino: novaDataTermino,
      dias_adicionados: addedDays,
      dias_totais_acumulados: newDays,
      dias_pagos_acumulados: diasPagosAcumulados,
      motivo: motivo || 'Necessidade de continuidade do tratamento médico prescrito.',
      medico_perito: medico || occ.medico_perito,
      crm: crm || occ.crm,
      created_at: now,
      created_by: actorEmail,
    };

    occ.prorrogacoes.push(extensionRecord);
    occ.status = 'Prorrogada';
    occ.data_termino = novaDataTermino;
    occ.quantidade_dias = newDays;
    occ.updated_at = now;
    if (medico) occ.medico_perito = medico;
    if (crm) occ.crm = crm;

    const dataHoraBR = new Date().toLocaleDateString('pt-BR');
    const notaProrrogacao = `\n[${sequencial}ª Prorrogação em ${dataHoraBR} por ${actorEmail}]: Data de término estendida de ${oldTermino} para ${novaDataTermino} (+${addedDays} dias, total ${newDays}d). Perito: ${extensionRecord.medico_perito} (${extensionRecord.crm}). Motivo: ${motivo}`;
    occ.parecer_tecnico = (occ.parecer_tecnico || '') + notaProrrogacao;

    const index = this.data.occurrences.findIndex(o => o.id === id);
    this.data.occurrences[index] = occ;

    this.syncEmployeeStatus(occ.matricula);

    this.addAuditLog({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'PRORROGAR',
      details: `${sequencial}ª Prorrogação da ${occ.tipo} Nº ${occ.id} concedida até ${novaDataTermino} (+${addedDays} dias, total ${newDays}d, ${diasPagosAcumulados}d pagos). Perito: ${extensionRecord.medico_perito}. Motivo: ${motivo}.`,
      changed_by: actorEmail,
      user_role: actorRole,
      diff: {
        before: { data_termino: oldTermino, quantidade_dias: occ.quantidade_dias - addedDays },
        after: { data_termino: novaDataTermino, quantidade_dias: newDays, dias_adicionados: addedDays, prorrogacao_id: extensionRecord.id }
      }
    });

    this.saveToDisk(this.data);
    return occ;
  }

  public concluirOccurrence(id: string, parecerFinal: string, actorEmail: string, actorRole: 'admin' | 'operator'): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    const now = new Date().toISOString();
    occ.status = 'Concluída';
    occ.updated_at = now;
    const dataHoraBR = new Date().toLocaleDateString('pt-BR');
    occ.parecer_tecnico = (occ.parecer_tecnico || '') + `\n[Conclusão em ${dataHoraBR}]: ${parecerFinal || 'Perícia de retorno realizada. Servidor apto.'}`;

    const index = this.data.occurrences.findIndex(o => o.id === id);
    this.data.occurrences[index] = occ;

    // Restore employee status if no other active occurrence exists
    this.syncEmployeeStatus(occ.matricula);

    this.addAuditLog({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'CONCLUIR',
      details: `Conclusão e encerramento pericial da ${occ.tipo} ${occ.id}. Parecer: ${parecerFinal}.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return occ;
  }

  public converterOccurrenceDefinitiva(
    id: string,
    dataConcessao: string,
    atoConcessao: string,
    motivo: string,
    medico: string,
    crm: string,
    parecerTecnico: string,
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    if (occ.status !== 'Ativa' && occ.status !== 'Prorrogada') {
      throw new Error(`Apenas licenças com status Ativa ou Prorrogada podem ser convertidas em definitiva. Status atual: ${occ.status}.`);
    }

    if (!dataConcessao || !dataConcessao.trim()) {
      throw new Error('A Data da Concessão é obrigatória para tornar a licença definitiva.');
    }

    // Regra Legal IPME: A licença permanente não poderá ser concedida dentro do prazo vigente de licença (só após essa data)
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

    const dataHoraBR = new Date().toLocaleDateString('pt-BR');
    const notaConversao = `\n[Conversão em Licença Definitiva em ${dataHoraBR} por ${actorEmail}]: Licença transformada de "${oldTipo}" para "Licença Definitiva". Data da Concessão: ${dataConcessao}${occ.ato_concessao ? ` | Ato Concessório: ${occ.ato_concessao}` : ''}. Médico Responsável: ${occ.medico_perito} (${occ.crm}). Justificativa: ${occ.motivo_definitiva}${parecerTecnico ? ` | Parecer Conclusivo: ${parecerTecnico}` : ''}`;
    occ.parecer_tecnico = (occ.parecer_tecnico || '') + notaConversao;

    const index = this.data.occurrences.findIndex(o => o.id === id);
    this.data.occurrences[index] = occ;

    this.syncEmployeeStatus(occ.matricula);

    this.addAuditLog({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'CONVERTER_DEFINITIVA',
      details: `Ocorrência Nº ${occ.id} do servidor ${occ.employee_nome} convertida em Licença Definitiva. Data de Concessão: ${dataConcessao}.${occ.ato_concessao ? ` Ato: ${occ.ato_concessao}.` : ''}`,
      changed_by: actorEmail,
      user_role: actorRole,
      diff: {
        before: { tipo: oldTipo },
        after: { tipo: 'Licença Definitiva', data_concessao: dataConcessao, ato_concessao: occ.ato_concessao }
      }
    });

    this.saveToDisk(this.data);
    return occ;
  }

  public cancelarOccurrence(id: string, motivo: string, actorEmail: string, actorRole: 'admin' | 'operator'): Occurrence {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error('Ocorrência não encontrada.');

    const now = new Date().toISOString();
    occ.status = 'Cancelada';
    occ.updated_at = now;
    const dataHoraBR = new Date().toLocaleDateString('pt-BR');
    occ.observacoes = (occ.observacoes || '') + `\n[Cancelamento em ${dataHoraBR} por ${actorEmail}]: ${motivo}`;

    const index = this.data.occurrences.findIndex(o => o.id === id);
    this.data.occurrences[index] = occ;

    this.syncEmployeeStatus(occ.matricula);

    this.addAuditLog({
      entity_type: 'occurrence',
      entity_id: occ.id,
      action: 'CANCELAR',
      details: `Cancelamento da ocorrência ${occ.id}. Justificativa: ${motivo}.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return occ;
  }

  public deleteOccurrence(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    if (actorRole !== 'admin') {
      throw new Error('Apenas Administradores podem excluir registros de afastamentos permanentemente.');
    }
    const occ = this.getOccurrenceById(id);
    if (!occ) return false;

    this.data.occurrences = this.data.occurrences.filter(o => o.id !== id);
    this.syncEmployeeStatus(occ.matricula);

    this.addAuditLog({
      entity_type: 'occurrence',
      entity_id: id,
      action: 'DELETE',
      details: `Registro de ${occ.tipo} ${id} (Servidor: ${occ.employee_nome}) excluído definitivamente do sistema.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return true;
  }

  public clearOccurrences(actorEmail: string, actorRole: 'admin' | 'operator'): number {
    const count = this.data.occurrences.length;
    this.data.occurrences = [];
    // Reset all employee statuses to Ativo
    for (const emp of this.data.employees) {
      emp.status = 'Ativo';
      emp.updated_at = new Date().toISOString();
    }
    this.addAuditLog({
      entity_type: 'occurrence',
      entity_id: 'ALL',
      action: 'DELETE',
      details: `Limpeza geral de ocorrências: ${count} afastamentos removidos para novos testes. Servidores mantidos com status Ativo.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });
    this.saveToDisk(this.data);
    return count;
  }

  private syncEmployeeStatus(matricula: string) {
    const empIndex = this.data.employees.findIndex(e => e.matricula.toUpperCase() === matricula.toUpperCase());
    if (empIndex === -1) return;

    // Look for active leaves/readaptações
    const activeOccurrences = this.data.occurrences.filter(
      o => o.matricula.toUpperCase() === matricula.toUpperCase() && (o.status === 'Ativa' || o.status === 'Prorrogada')
    );

    let nextStatus: 'Ativo' | 'Licenciado' | 'Readaptado' = 'Ativo';
    if (activeOccurrences.length > 0) {
      // Prioritize any leave type over Readaptação
      const hasLicenca = activeOccurrences.some(o => o.tipo !== 'Readaptação');
      nextStatus = hasLicenca ? 'Licenciado' : 'Readaptado';
    }

    if (this.data.employees[empIndex].status !== nextStatus) {
      const prev = this.data.employees[empIndex].status;
      this.data.employees[empIndex].status = nextStatus;
      this.data.employees[empIndex].updated_at = new Date().toISOString();

      this.addAuditLog({
        entity_type: 'employee',
        entity_id: matricula,
        action: 'UPDATE',
        details: `Status funcional sincronizado automaticamente: de "${prev}" para "${nextStatus}".`,
        changed_by: 'Sistema IPME (Automação)',
        user_role: 'admin',
      });
    }
  }

  public getAuditLogs(entityType?: string, search?: string): AuditLog[] {
    let list = [...this.data.audit_logs];
    if (entityType && entityType !== 'ALL') {
      list = list.filter(l => l.entity_type === entityType);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l => l.details.toLowerCase().includes(q) || l.entity_id.toLowerCase().includes(q) || l.changed_by.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  public getUsers(): AppUser[] {
    return this.data.users;
  }

  public saveUser(userData: Partial<AppUser> & { email: string; name: string; role: 'admin' | 'operator' }, actorEmail: string, actorRole: 'admin' | 'operator'): AppUser {
    if (actorRole !== 'admin') {
      throw new Error('Apenas Administradores podem gerenciar contas de usuários e permissões.');
    }
    const existingIndex = this.data.users.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase());
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = this.data.users[existingIndex];
      const updated: AppUser = {
        ...existing,
        ...userData,
      };
      this.data.users[existingIndex] = updated;

      this.addAuditLog({
        entity_type: 'user',
        entity_id: updated.email,
        action: 'UPDATE',
        details: `Usuário ${updated.name} (${updated.email}) atualizado. Papel: ${updated.role}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return updated;
    } else {
      const created: AppUser = {
        id: `user_${Date.now()}`,
        email: userData.email.toLowerCase(),
        name: userData.name,
        role: userData.role,
        auth_provider: userData.email.endsWith('@eusebio.ce.gov.br') ? 'corporate' : 'google',
        department: userData.department || 'IPME',
        created_at: now,
      };
      this.data.users.push(created);

      this.addAuditLog({
        entity_type: 'user',
        entity_id: created.email,
        action: 'CREATE',
        details: `Novo usuário concedido acesso ao IPME: ${created.name} (${created.email}), Nível: ${created.role}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return created;
    }
  }

  public getSecretarias(search?: string, apenasAtivas?: boolean): Secretaria[] {
    let list = [...(this.data.secretarias || [])];
    if (apenasAtivas) {
      list = list.filter(s => s.ativa);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        s =>
          s.sigla.toLowerCase().includes(q) ||
          s.nome.toLowerCase().includes(q) ||
          (s.secretario && s.secretario.toLowerCase().includes(q))
      );
    }

    // Attach count of servidores lotados
    return list.map(s => {
      const servidoresCount = this.data.employees.filter(
        e =>
          e.secretaria.toLowerCase().includes(s.sigla.toLowerCase()) ||
          e.secretaria.toLowerCase().includes(s.nome.toLowerCase())
      ).length;
      return {
        ...s,
        servidores_count: servidoresCount,
      };
    }).sort((a, b) => a.sigla.localeCompare(b.sigla));
  }

  public getSecretariaById(id: string): Secretaria | undefined {
    const sec = this.data.secretarias?.find(s => s.id === id || s.sigla.toUpperCase() === id.toUpperCase());
    if (!sec) return undefined;
    const servidoresCount = this.data.employees.filter(
      e =>
        e.secretaria.toLowerCase().includes(sec.sigla.toLowerCase()) ||
        e.secretaria.toLowerCase().includes(sec.nome.toLowerCase())
    ).length;
    return { ...sec, servidores_count: servidoresCount };
  }

  public saveSecretaria(
    secretariaData: Partial<Secretaria> & { sigla: string; nome: string },
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): Secretaria {
    if (!this.data.secretarias) {
      this.data.secretarias = [...DEFAULT_SECRETARIAS];
    }

    const cleanSigla = secretariaData.sigla.trim().toUpperCase();
    const cleanNome = secretariaData.nome.trim();
    const now = new Date().toISOString();

    const existingIndex = this.data.secretarias.findIndex(
      s => s.id === secretariaData.id || s.sigla.toUpperCase() === cleanSigla
    );

    if (existingIndex >= 0) {
      const existing = this.data.secretarias[existingIndex];
      const updated: Secretaria = {
        ...existing,
        ...secretariaData,
        sigla: cleanSigla,
        nome: cleanNome,
        ativa: secretariaData.ativa !== undefined ? secretariaData.ativa : existing.ativa,
        updated_at: now,
      };
      this.data.secretarias[existingIndex] = updated;

      this.addAuditLog({
        entity_type: 'user',
        entity_id: updated.sigla,
        action: 'UPDATE',
        details: `Secretaria ${updated.sigla} - ${updated.nome} atualizada pelo usuário.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return updated;
    } else {
      const id = `SEC-${cleanSigla}`;
      const created: Secretaria = {
        id,
        sigla: cleanSigla,
        nome: cleanNome,
        secretario: secretariaData.secretario?.trim() || '',
        email: secretariaData.email?.trim() || '',
        telefone: secretariaData.telefone?.trim() || '',
        endereco: secretariaData.endereco?.trim() || '',
        ativa: secretariaData.ativa !== undefined ? secretariaData.ativa : true,
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
      };
      this.data.secretarias.push(created);

      this.addAuditLog({
        entity_type: 'user',
        entity_id: created.sigla,
        action: 'CREATE',
        details: `Nova Secretaria cadastrada no IPME: ${created.sigla} - ${created.nome}.`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return created;
    }
  }

  public deleteSecretaria(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    if (actorRole !== 'admin') {
      throw new Error('Apenas Administradores podem excluir secretarias do sistema.');
    }
    const sec = this.getSecretariaById(id);
    if (!sec) return false;

    // Check if there are employees assigned to this secretaria
    const assignedEmployees = this.data.employees.filter(
      e =>
        e.secretaria.toLowerCase().includes(sec.sigla.toLowerCase()) ||
        e.secretaria.toLowerCase().includes(sec.nome.toLowerCase())
    );

    if (assignedEmployees.length > 0) {
      throw new Error(
        `Não é possível excluir a secretaria ${sec.sigla} pois existem ${assignedEmployees.length} servidor(es) lotado(s) nela. Desative-a ou transfira os servidores antes de excluir.`
      );
    }

    this.data.secretarias = this.data.secretarias.filter(s => s.id !== sec.id && s.sigla.toUpperCase() !== sec.sigla.toUpperCase());

    this.addAuditLog({
      entity_type: 'user',
      entity_id: sec.sigla,
      action: 'DELETE',
      details: `Secretaria ${sec.sigla} - ${sec.nome} excluída definitivamente do sistema.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return true;
  }

  // --- Doctors CRUD ---

  public getDoctors(search?: string, ativoOnly?: boolean): Doctor[] {
    if (!this.data.doctors) {
      this.data.doctors = [...DEFAULT_DOCTORS];
    }
    let result = [...this.data.doctors];
    if (ativoOnly) {
      result = result.filter(d => d.ativo);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        d =>
          d.nome.toLowerCase().includes(q) ||
          d.crm.toLowerCase().includes(q) ||
          (d.especialidade && d.especialidade.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => {
      const numA = parseInt(a.id, 10);
      const numB = parseInt(b.id, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.id.localeCompare(b.id);
    });
  }

  public getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find(d => d.id === id);
  }

  public saveDoctor(
    doctorData: Partial<Doctor>,
    actorEmail: string,
    actorRole: 'admin' | 'operator'
  ): Doctor {
    if (!this.data.doctors) {
      this.data.doctors = [...DEFAULT_DOCTORS];
    }

    const cleanNome = doctorData.nome?.trim();
    const cleanCrm = doctorData.crm?.trim();

    if (!cleanNome) {
      throw new Error('O Nome do Médico é obrigatório.');
    }
    if (!cleanCrm) {
      throw new Error('O Número do Registro CRM é obrigatório.');
    }

    const now = new Date().toISOString();
    const targetIsDiretor = doctorData.is_diretor !== undefined ? Boolean(doctorData.is_diretor) : undefined;
    if (targetIsDiretor === true) {
      for (const d of this.data.doctors) {
        d.is_diretor = false;
      }
    }

    if (doctorData.id) {
      const index = this.data.doctors.findIndex(d => d.id === doctorData.id);
      if (index === -1) {
        throw new Error('Médico não encontrado para atualização.');
      }
      const existing = this.data.doctors[index];
      const updated: Doctor = {
        ...existing,
        nome: cleanNome,
        crm: cleanCrm,
        especialidade: doctorData.especialidade?.trim() || existing.especialidade || '',
        vinculo: doctorData.vinculo || existing.vinculo || 'Efetivo',
        is_diretor: targetIsDiretor !== undefined ? targetIsDiretor : Boolean(existing.is_diretor),
        ativo: doctorData.ativo !== undefined ? doctorData.ativo : existing.ativo,
        updated_at: now,
      };

      this.data.doctors[index] = updated;

      this.addAuditLog({
        entity_type: 'doctor',
        entity_id: updated.crm,
        action: 'UPDATE',
        details: `Cadastro do Médico ${updated.nome} (${updated.crm}) atualizado no IPME. Vínculo: ${updated.vinculo}.${updated.is_diretor ? ' Definido como Médico Diretor da Junta Pericial.' : ''}`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return updated;
    } else {
      // Check duplicate CRM
      const duplicate = this.data.doctors.find(d => d.crm.toLowerCase() === cleanCrm.toLowerCase());
      if (duplicate) {
        throw new Error(`Já existe um médico cadastrado com o CRM ${cleanCrm} (${duplicate.nome}).`);
      }

      // Generate next sequential ID: 1, 2, 3...
      const maxId = this.data.doctors.reduce((max, d) => {
        const num = parseInt(d.id, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      const id = String(maxId + 1);

      const created: Doctor = {
        id,
        nome: cleanNome,
        crm: cleanCrm,
        especialidade: doctorData.especialidade?.trim() || 'Medicina Pericial / Clínica',
        vinculo: doctorData.vinculo || 'Efetivo',
        is_diretor: targetIsDiretor === true,
        ativo: doctorData.ativo !== undefined ? doctorData.ativo : true,
        created_at: now,
        updated_at: now,
        created_by: actorEmail,
      };

      this.data.doctors.push(created);

      this.addAuditLog({
        entity_type: 'doctor',
        entity_id: created.crm,
        action: 'CREATE',
        details: `Novo Médico Perito cadastrado no IPME: ${created.nome} (${created.crm}). Vínculo: ${created.vinculo}.${created.is_diretor ? ' Definido como Diretor Médico.' : ''}`,
        changed_by: actorEmail,
        user_role: actorRole,
      });

      this.saveToDisk(this.data);
      return created;
    }
  }

  public setDoctorDiretor(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): Doctor {
    const doc = this.getDoctorById(id);
    if (!doc) {
      throw new Error('Médico não encontrado.');
    }
    // Set all doctors is_diretor = false
    for (const d of this.data.doctors) {
      d.is_diretor = false;
    }
    doc.is_diretor = true;
    doc.ativo = true; // Ensure active
    doc.updated_at = new Date().toISOString();

    this.addAuditLog({
      entity_type: 'doctor',
      entity_id: doc.crm,
      action: 'UPDATE',
      details: `Dr(a). ${doc.nome} (${doc.crm}) definido como Médico Diretor da Junta Médica Pericial Oficial.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return doc;
  }

  public deleteDoctor(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): boolean {
    if (actorRole !== 'admin') {
      throw new Error('Apenas Administradores podem excluir médicos do cadastro.');
    }
    const doc = this.getDoctorById(id);
    if (!doc) return false;

    // Check if doctor has occurrences associated
    const associatedOccurrences = this.data.occurrences.filter(
      o =>
        (o.crm && o.crm.toLowerCase().includes(doc.crm.toLowerCase())) ||
        (o.medico_perito && o.medico_perito.toLowerCase().includes(doc.nome.toLowerCase()))
    );

    if (associatedOccurrences.length > 0) {
      throw new Error(
        `Não é possível excluir o Dr(a). ${doc.nome} pois existem ${associatedOccurrences.length} laudo(s) ou licença(s) vinculado(s) ao seu CRM. Desative o cadastro em vez de excluir para preservar a rastreabilidade pericial.`
      );
    }

    this.data.doctors = this.data.doctors.filter(d => d.id !== doc.id);

    this.addAuditLog({
      entity_type: 'doctor',
      entity_id: doc.crm,
      action: 'DELETE',
      details: `Médico ${doc.nome} (${doc.crm}) excluído do sistema IPME.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return true;
  }

  public toggleDoctorStatus(id: string, actorEmail: string, actorRole: 'admin' | 'operator'): Doctor {
    const doc = this.getDoctorById(id);
    if (!doc) {
      throw new Error('Médico não encontrado.');
    }
    doc.ativo = !doc.ativo;
    doc.updated_at = new Date().toISOString();

    this.addAuditLog({
      entity_type: 'doctor',
      entity_id: doc.crm,
      action: 'UPDATE',
      details: `Status do médico ${doc.nome} (${doc.crm}) alterado para: ${doc.ativo ? 'ATIVO' : 'INATIVO'}.`,
      changed_by: actorEmail,
      user_role: actorRole,
    });

    this.saveToDisk(this.data);
    return doc;
  }

  public getMetrics(): DashboardMetrics {
    const totalEmployees = this.data.employees.length;
    const totalAtivos = this.data.employees.filter(e => e.status === 'Ativo').length;
    const totalLicencaSaude = this.data.employees.filter(e => e.status === 'Licenciado').length;
    const totalReadaptados = this.data.employees.filter(e => e.status === 'Readaptado').length;

    // Recent active occurrences
    const recentOccurrences = this.getOccurrences().slice(0, 5);

    // Expiring soon: within next 30 days
    const todayStr = new Date().toISOString().split('T')[0];
    const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiringSoon = this.data.occurrences
      .filter(o => (o.status === 'Ativa' || o.status === 'Prorrogada') && o.data_termino >= todayStr && o.data_termino <= next30Days)
      .sort((a, b) => a.data_termino.localeCompare(b.data_termino));

    // Secretarias breakdown
    const secMap: Record<string, { count: number; licencaCount: number; readaptadoCount: number }> = {};
    for (const emp of this.data.employees) {
      const shortSec = emp.secretaria.split(' - ')[0] || emp.secretaria;
      if (!secMap[shortSec]) {
        secMap[shortSec] = { count: 0, licencaCount: 0, readaptadoCount: 0 };
      }
      secMap[shortSec].count++;
      if (emp.status === 'Licenciado') secMap[shortSec].licencaCount++;
      if (emp.status === 'Readaptado') secMap[shortSec].readaptadoCount++;
    }

    const secretariaBreakdown = Object.entries(secMap).map(([secretaria, stats]) => ({
      secretaria,
      ...stats,
    }));

    const leaveTypeBreakdown = [
      { name: 'Licença Saúde', value: this.data.occurrences.filter(o => o.tipo === 'Licença Saúde' && (o.status === 'Ativa' || o.status === 'Prorrogada')).length },
      { name: 'Licença Maternidade', value: this.data.occurrences.filter(o => o.tipo === 'Licença Maternidade' && (o.status === 'Ativa' || o.status === 'Prorrogada')).length },
      { name: 'Licença Definitiva', value: this.data.occurrences.filter(o => o.tipo === 'Licença Definitiva' && (o.status === 'Ativa' || o.status === 'Prorrogada')).length },
      { name: 'Readaptação', value: this.data.occurrences.filter(o => o.tipo === 'Readaptação' && (o.status === 'Ativa' || o.status === 'Prorrogada')).length },
      { name: 'Concluídas / Históricas', value: this.data.occurrences.filter(o => o.status === 'Concluída').length },
    ];

    return {
      totalEmployees,
      totalAtivos,
      totalLicencaSaude,
      totalReadaptados,
      recentOccurrences,
      expiringSoon,
      secretariaBreakdown,
      leaveTypeBreakdown,
    };
  }

  private addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.data.audit_logs.unshift(entry);
    // keep max 500 audit entries
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
  }

  private calculateDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }
}

export const db = new DatabaseManager();
