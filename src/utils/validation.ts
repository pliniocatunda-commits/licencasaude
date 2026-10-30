/**
 * Utility functions for CPF validation, formatting, dates, and CID data
 */

export function limparCaracteres(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function formatarCPF(cpf: string): string {
  const digits = limparCaracteres(cpf).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function validarCPF(cpf: string): boolean {
  const clean = limparCaracteres(cpf);
  if (clean.length !== 11) return false;

  // Check for repeated sequences like 11111111111
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Validate first verifier digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  // Validate second verifier digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

export function formatarTelefone(tel: string): string {
  const digits = limparCaracteres(tel).slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function calcularQuantidadeDias(dataInicio: string, dataTermino: string): number {
  if (!dataInicio || !dataTermino) return 0;
  const inicio = new Date(dataInicio + 'T00:00:00');
  const termino = new Date(dataTermino + 'T00:00:00');
  if (isNaN(inicio.getTime()) || isNaN(termino.getTime())) return 0;
  const diffTime = termino.getTime() - inicio.getTime();
  if (diffTime < 0) return 0;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  return diffDays;
}

/**
 * Calcula a quantidade de dias pagos pelo instituto (IPME):
 * Regra: os primeiros 15 dias de afastamento são de responsabilidade da Prefeitura.
 * O benefício previdenciário só é contado e pago a partir do 16º dia (dias excedentes a 15).
 */
export function calcularDiasPagos(totalDias: number): number {
  if (!totalDias || totalDias <= 15) return 0;
  return totalDias - 15;
}

export function formatarDataBR(dataStr?: string): string {
  if (!dataStr) return '-';
  // Handle ISO string or YYYY-MM-DD
  const parts = dataStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataStr;
}

export function formatarDataHoraBR(isoStr?: string): string {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export const SECRETARIAS_MUNICIPAIS = [
  'SME - Secretaria Municipal de Educação',
  'SMS - Secretaria Municipal de Saúde',
  'SEFIN - Secretaria Municipal de Finanças',
  'SDS - Secretaria de Desenvolvimento Social',
  'SEINFRA - Secretaria de Infraestrutura e Obras',
  'SEAD - Secretaria de Administração e Planejamento',
  'SMSPC - Secretaria de Segurança Pública e Cidadania',
  'SECULT - Secretaria de Cultura e Turismo',
  'SEMA - Secretaria de Meio Ambiente e Urbanismo',
  'GAB - Gabinete do Prefeito',
  'IPME - Instituto de Previdência do Município de Eusébio',
];

export const CID_CATALOG = [
  { code: 'M54.5', description: 'Dor lombar baixa (Lombalgia)' },
  { code: 'M54.4', description: 'Lumbago com ciática' },
  { code: 'M75.1', description: 'Síndrome do manguito rotador' },
  { code: 'M65.8', description: 'Outras sinovites e tenossinovites (LER/DORT)' },
  { code: 'G56.0', description: 'Síndrome do túnel do carpo' },
  { code: 'F32.1', description: 'Episódio depressivo moderado' },
  { code: 'F32.2', description: 'Episódio depressivo grave sem sintomas psicóticos' },
  { code: 'F41.0', description: 'Transtorno de pânico (ansiedade paroxística episódica)' },
  { code: 'F41.1', description: 'Transtorno de ansiedade generalizada' },
  { code: 'F43.1', description: 'Estado de estresse pós-traumático' },
  { code: 'F43.2', description: 'Transtornos de adaptação / Burnout' },
  { code: 'I10', description: 'Hipertensão essencial (primária)' },
  { code: 'I20.0', description: 'Angina instável' },
  { code: 'S83.2', description: 'Ruptura do menisco atual' },
  { code: 'S52.5', description: 'Fratura da extremidade inferior do rádio' },
  { code: 'O80', description: 'Parto único espontâneo (Licença Maternidade)' },
  { code: 'Z39.0', description: 'Assistência e exame pós-parto imediato' },
  { code: 'Z34.0', description: 'Supervisão de gravidez normal' },
  { code: 'M99.9', description: 'Lesão biomecânica crônica (Incapacidade Definitiva)' },
  { code: 'Z54.0', description: 'Convalescença pós-cirúrgica' },
  { code: 'Z54.9', description: 'Convalescença por tratamento não especificado' },
  { code: 'Outro', description: 'Outro código CID-10' },
];

export function exportarCSV(nomeArquivo: string, cabecalhos: string[], linhas: (string | number)[][]) {
  // UTF-8 BOM for Brazilian Excel compatibility
  const BOM = '\uFEFF';
  const conteudo = [
    cabecalhos.map(c => `"${c.replace(/"/g, '""')}"`).join(';'),
    ...linhas.map(linha =>
      linha.map(valor => `"${String(valor ?? '').replace(/"/g, '""')}"`).join(';')
    ),
  ].join('\r\n');

  const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivo}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Verifica se a previsão de retorno de um afastamento está em atraso baseado na data do dia atual.
 * Critério: Afastamento não-definitivo, não arquivado/concluído/cancelado, com data de término anterior ao dia de hoje.
 */
export function isPrevisaoRetornoEmAtraso(
  dataTermino?: string,
  status?: string,
  tipo?: string
): boolean {
  if (!dataTermino || tipo === 'Licença Definitiva') return false;
  if (status === 'Arquivado' || status === 'Concluída' || status === 'Cancelada') return false;

  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  const hojeStr = `${ano}-${mes}-${dia}`;

  const terminoStr = dataTermino.split('T')[0];
  return terminoStr < hojeStr;
}

/**
 * Calcula a quantidade de dias corridos em atraso em relação à data do dia.
 */
export function calcularDiasAtraso(dataTermino?: string): number {
  if (!dataTermino) return 0;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const termino = new Date(dataTermino.split('T')[0] + 'T00:00:00');
  if (isNaN(termino.getTime())) return 0;
  const diffMs = hoje.getTime() - termino.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export interface NormalizedSecretaria {
  canonicalKey: string; // Ex: "SME - SECRETARIA DE EDUCACAO"
  sigla: string;        // Ex: "SME"
  nome: string;         // Ex: "SECRETARIA DE EDUCACAO"
  display: string;      // Ex: "SME - SECRETARIA DE EDUCACAO"
}

// Catálogo oficial canônico de Secretarias do Município de Eusébio
const DEFAULT_CANONICAL_SECRETARIAS: Array<{ sigla: string; nome: string }> = [
  { sigla: 'SME', nome: 'SECRETARIA DE EDUCACAO' },
  { sigla: 'SMS', nome: 'SECRETARIA MUNICIPAL DA SAUDE' },
  { sigla: 'SEFIN', nome: 'SECRETARIA DE FINANCAS E PLANEJAMENTO' },
  { sigla: 'SEINFRA', nome: 'SEC MUN INFRAESTRUTURA E SERVICOS PUBL' },
  { sigla: 'SMSPC', nome: 'SECRETARIA MUNICIPAL SEGURANCA PUBLICA' },
  { sigla: 'SECULT', nome: 'SECRETARIA DE CULTURA E TURISMO' },
  { sigla: 'SEMA', nome: 'SECRETARIA DE MEIO AMBIENTE E URBANISMO' },
  { sigla: 'SDS', nome: 'SECRETARIA DE DESENVOLVIMENTO SOCIAL' },
  { sigla: 'SMDS', nome: 'SECRETARIA MUN DESENVOLVIMENTO SOCIAL' },
  { sigla: 'SEAD', nome: 'SECRETARIA DE ADMINISTRACAO E PLANEJAMENTO' },
  { sigla: 'GAPRE', nome: 'GABINETE DO PREFEITO' },
  { sigla: 'GAB', nome: 'GABINETE DO PREFEITO' },
  { sigla: 'SEGOV', nome: 'SEC GOV E DESENVOLVIMENTO GESTAO' },
  { sigla: 'AMT', nome: 'AUTARQUIA MUNICIPAL DE TRANSITO' },
  { sigla: 'SMEJ', nome: 'SECRETARIA MUN ESPORTE E JUVENTUDE' },
  { sigla: 'AMMA', nome: 'AUTARQUIA MUNICIPAL DO MEIO AMBIENTE' },
  { sigla: 'CGM', nome: 'CONTROLADORIA E OUVIDORIA GERAL DO MUN' },
  { sigla: 'PGM', nome: 'PROCURADORIA GERAL DO MUNICIPIO' },
  { sigla: 'IPME', nome: 'INSTITUTO DE PREVIDENCIA DO MUNICIPIO DE EUSEBIO' },
];

/**
 * Normaliza qualquer formato de secretaria (com ou sem sigla, abreviado ou por extenso)
 * para uma representação canônica padronizada `${sigla} - ${nome}`.
 * Garante que servidores importados e cadastrados manualmente na mesma secretaria
 * fiquem rigorosamente unificados no mesmo bloco do relatório executivo e filtros.
 */
export function normalizeSecretaria(
  rawSec: string | undefined | null,
  secretariasList?: Array<{ sigla?: string; nome?: string }>
): NormalizedSecretaria {
  const raw = (rawSec || '').trim();
  if (!raw) {
    return {
      canonicalKey: 'OUTROS - Outros Órgãos / Geral',
      sigla: 'OUTROS',
      nome: 'Outros Órgãos / Geral',
      display: 'OUTROS - Outros Órgãos / Geral',
    };
  }

  // Prepara lista combinada
  const pool: Array<{ sigla: string; nome: string }> = [];
  if (secretariasList && Array.isArray(secretariasList)) {
    for (const s of secretariasList) {
      if (s && s.sigla && s.nome) {
        pool.push({ sigla: s.sigla.trim(), nome: s.nome.trim() });
      }
    }
  }
  for (const def of DEFAULT_CANONICAL_SECRETARIAS) {
    if (!pool.some(p => p.sigla.toUpperCase() === def.sigla.toUpperCase())) {
      pool.push(def);
    }
  }

  const stripAccents = (str: string) =>
    str.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const cleanRaw = stripAccents(raw);

  // 1. Verificação se já está no formato exato "SIGLA - NOME"
  for (const s of pool) {
    const sSigla = s.sigla.toUpperCase();
    const sNome = stripAccents(s.nome);
    const expectedCanonical = `${sSigla} - ${s.nome}`;

    if (cleanRaw === `${sSigla} - ${sNome}`) {
      return {
        canonicalKey: expectedCanonical,
        sigla: s.sigla,
        nome: s.nome,
        display: expectedCanonical,
      };
    }
  }

  // 2. Verificação se bate pela sigla isolada ou por prefixo "SIGLA -"
  for (const s of pool) {
    const sSigla = s.sigla.toUpperCase();
    const expectedCanonical = `${s.sigla} - ${s.nome}`;

    if (cleanRaw === sSigla) {
      return {
        canonicalKey: expectedCanonical,
        sigla: s.sigla,
        nome: s.nome,
        display: expectedCanonical,
      };
    }

    if (cleanRaw.startsWith(`${sSigla} -`) || cleanRaw.startsWith(`${sSigla}-`)) {
      return {
        canonicalKey: expectedCanonical,
        sigla: s.sigla,
        nome: s.nome,
        display: expectedCanonical,
      };
    }
  }

  // 3. Verificação por igualdade ou inclusão do nome da secretaria
  for (const s of pool) {
    const sNome = stripAccents(s.nome);
    const expectedCanonical = `${s.sigla} - ${s.nome}`;

    if (cleanRaw === sNome) {
      return {
        canonicalKey: expectedCanonical,
        sigla: s.sigla,
        nome: s.nome,
        display: expectedCanonical,
      };
    }

    // Se o nome contiver palavras-chave essenciais (ex: "EDUCACAO", "SAUDE", "FINANCAS", "SEGURANCA")
    if (sNome.length > 5 && (cleanRaw.includes(sNome) || sNome.includes(cleanRaw))) {
      return {
        canonicalKey: expectedCanonical,
        sigla: s.sigla,
        nome: s.nome,
        display: expectedCanonical,
      };
    }
  }

  // 4. Se tiver o formato "PARTE1 - PARTE2"
  if (raw.includes(' - ')) {
    const [partSigla, ...rest] = raw.split(' - ');
    const partNome = rest.join(' - ').trim();
    return {
      canonicalKey: raw,
      sigla: partSigla.trim().toUpperCase(),
      nome: partNome,
      display: raw,
    };
  }

  // 5. Fallback genérico
  return {
    canonicalKey: raw,
    sigla: raw.slice(0, 8).toUpperCase(),
    nome: raw,
    display: raw,
  };
}
