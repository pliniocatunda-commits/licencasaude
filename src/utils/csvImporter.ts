import { formatarCPF, limparCaracteres } from './validation.ts';

/**
 * Tabela oficial de siglas e nomes das Secretarias e Órgãos da Prefeitura Municipal de Eusébio
 */
export const CODIGO_SECRETARIAS_MAP: Record<string, { sigla: string; nome: string }> = {
  '001': { sigla: 'SEFIN', nome: 'SECRETARIA DE FINANCAS E PLANEJAMENTO' },
  '002': { sigla: 'SEGOV', nome: 'SEC GOV E DESENVOLVIMENTO GESTAO' },
  '003': { sigla: 'SEINFRA', nome: 'SEC MUN INFRAESTRUTURA E SERVICOS PUBL' },
  '004': { sigla: 'SME', nome: 'SECRETARIA DE EDUCACAO' },
  '005': { sigla: 'SMS', nome: 'SECRETARIA MUNICIPAL DA SAUDE' },
  '006': { sigla: 'SMDS', nome: 'SECRETARIA MUN DESENVOLVIMENTO SOCIAL' },
  '009': { sigla: 'GAPRE', nome: 'GABINETE DO PREFEITO' },
  '010': { sigla: 'PGM', nome: 'PROCURADORIA GERAL DO MUNICIPIO' },
  '013': { sigla: 'SMSPC', nome: 'SECRETARIA MUNICIPAL SEGURANCA PUBLICA' },
  '015': { sigla: 'AMT', nome: 'AUTARQUIA MUNICIPAL DE TRANSITO' },
  '016': { sigla: 'SMEJ', nome: 'SECRETARIA MUN ESPORTE E JUVENTUDE' },
  '017': { sigla: 'SECULT', nome: 'SECRETARIA DE CULTURA E TURISMO' },
  '018': { sigla: 'AMMA', nome: 'AUTARQUIA MUNICIPAL DO MEIO AMBIENTE' },
  '020': { sigla: 'CGM', nome: 'CONTROLADORIA E OUVIDORIA GERAL DO MUN' },
};

export const CODIGO_SIGLAS_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CODIGO_SECRETARIAS_MAP).map(([cod, info]) => [cod, info.sigla])
);

/**
 * Trata o campo de telefone conforme a regra oficial do usuário:
 * - Caso tenha exatamente 11 dígitos: formata com máscara de DDD (XX) 9XXXX-XXXX
 * - Caso não esteja completa com 11 dígitos: ignora e retorna vazio
 * - Caso tenha 11 dígitos repetidos (ex: 99999999999 ou 00000000000): ignora por ser fictício
 */
export function formatarTelefoneCSV(val: string | undefined): { telefone: string; formatado: boolean } {
  if (!val) return { telefone: '', formatado: false };
  const digits = limparCaracteres(val);
  
  if (digits.length !== 11) {
    return { telefone: '', formatado: false };
  }

  // Verifica se não é número fictício repetido (ex: 99999999999 ou 00000000000)
  if (/^(\d)\1{10}$/.test(digits)) {
    return { telefone: '', formatado: false };
  }

  const ddd = digits.slice(0, 2);
  const parte1 = digits.slice(2, 7);
  const parte2 = digits.slice(7);
  return { 
    telefone: `(${ddd}) ${parte1}-${parte2}`, 
    formatado: true 
  };
}

/**
 * Converte data de admissão no formato DD/MM/YYYY para o padrão ISO YYYY-MM-DD
 */
export function parseDataAdmissaoCSV(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  return '';
}

export interface ParsedEmployeeRow {
  matricula: string;
  nome: string;
  telefone: string;
  telefoneOriginal: string;
  telefoneValido: boolean;
  data_admissao: string;
  cargo: string;
  cpf: string;
  cod_secretaria: string;
  nome_secretaria: string;
  sigla_secretaria: string;
  secretaria_completa: string;
  email: string;
  status: 'Ativo';
}

export interface ParsedSecretariaItem {
  id: string;
  sigla: string;
  nome: string;
  codigo: string;
  servidores_count: number;
}

export interface ParseCSVResult {
  rows: ParsedEmployeeRow[];
  secretarias: ParsedSecretariaItem[];
  totalRows: number;
  telefonesValidos: number;
  telefonesIgnorados: number;
  erros: string[];
}

/**
 * Realiza o parsing completo de um texto CSV contendo os servidores e secretarias.
 * Ordem oficial com Cargo inserido após a Data de Admissão:
 * 0: Matricula
 * 1: nome
 * 2: Telefone
 * 3: data admissão
 * 4: cargo
 * 5: cpf
 * 6: cod. secretaria
 * 7: secretaria
 * 8: e-mail
 */
export function parseServidoresCSV(csvText: string): ParseCSVResult {
  const result: ParseCSVResult = {
    rows: [],
    secretarias: [],
    totalRows: 0,
    telefonesValidos: 0,
    telefonesIgnorados: 0,
    erros: [],
  };

  if (!csvText || !csvText.trim()) {
    result.erros.push('O arquivo CSV está vazio.');
    return result;
  }

  const rawLines = csvText.split(/\r?\n/);
  const secretariasMap = new Map<string, { sigla: string; nome: string; count: number }>();
  const matriculasSet = new Set<string>();

  // Estrutura padrão com 9 colunas (Cargo após Data de Admissão)
  let colMap = {
    matricula: 0,
    nome: 1,
    celular: 2,
    dataAdm: 3,
    cargo: 4,
    cpf: 5,
    codAdmin: 6,
    nomeAdmin: 7,
    email: 8,
  };

  let hasCustomColMap = false;
  let isFirstLine = true;

  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const rawLine = rawLines[lineIndex].trim();
    if (!rawLine) continue;

    // Detectar delimitador (ponto e vírgula ou vírgula)
    const delimiter = rawLine.includes(';') ? ';' : ',';
    const parts = rawLine.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

    // 1. Analisar linha de cabeçalho
    if (isFirstLine) {
      isFirstLine = false;
      const lower = rawLine.toLowerCase();
      
      const isHeader = 
        lower.includes('matr') || 
        lower.includes('nome') || 
        lower.includes('cpf') || 
        lower.includes('cargo') ||
        lower.includes('admin') ||
        lower.includes('secretaria');

      if (isHeader) {
        let detectedMatr = -1;
        let detectedNome = -1;
        let detectedCel = -1;
        let detectedAdm = -1;
        let detectedCargo = -1;
        let detectedCpf = -1;
        let detectedCodSec = -1;
        let detectedNomeSec = -1;
        let detectedEmail = -1;

        parts.forEach((col, idx) => {
          const c = col.toLowerCase().trim();
          
          if (c.includes('matr') || c === 'mat') {
            detectedMatr = idx;
          } else if (c.includes('cargo') || c.includes('função') || c.includes('funcao')) {
            detectedCargo = idx;
          } else if (c.includes('cpf') || c.includes('cic')) {
            detectedCpf = idx;
          } else if (
            c.includes('cód') || 
            c.includes('cod') || 
            c.startsWith('cd.') || 
            c.startsWith('cd ') ||
            c === 'cd'
          ) {
            // É a coluna de código da secretaria/órgão (ex: "cod. secretaria", "cd. admin", "cód. admin")
            detectedCodSec = idx;
          } else if (
            c.includes('secretaria') || 
            c.includes('admin') || 
            c.includes('órgão') || 
            c.includes('orgao') || 
            c.includes('lotação') || 
            c.includes('lotacao')
          ) {
            // É o nome da secretaria (ex: "secretaria", "nome admin", "órgão")
            detectedNomeSec = idx;
          } else if (c.includes('cel') || c.includes('tel') || c.includes('fone')) {
            detectedCel = idx;
          } else if (c.includes('adm') || c.includes('data')) {
            detectedAdm = idx;
          } else if (c.includes('mail')) {
            detectedEmail = idx;
          } else if (c.includes('nome') || c.includes('func') || c.includes('serv')) {
            detectedNome = idx;
          }
        });

        // Se detectou pelo menos matrícula e nome, adota o mapeamento encontrado
        if (detectedMatr !== -1 && (detectedNome !== -1 || parts.length >= 5)) {
          hasCustomColMap = true;
          colMap.matricula = detectedMatr !== -1 ? detectedMatr : 0;
          colMap.nome = detectedNome !== -1 ? detectedNome : 1;
          colMap.celular = detectedCel !== -1 ? detectedCel : 2;
          colMap.dataAdm = detectedAdm !== -1 ? detectedAdm : 3;
          colMap.cargo = detectedCargo;
          colMap.cpf = detectedCpf !== -1 ? detectedCpf : 5;
          colMap.codAdmin = detectedCodSec !== -1 ? detectedCodSec : 6;
          colMap.nomeAdmin = detectedNomeSec !== -1 ? detectedNomeSec : 7;
          colMap.email = detectedEmail !== -1 ? detectedEmail : 8;

          // Se não encontrou coluna de cargo no cabeçalho e temos apenas 8 colunas
          if (detectedCargo === -1 && parts.length === 8) {
            colMap.cpf = detectedCpf !== -1 ? detectedCpf : 4;
            colMap.codAdmin = detectedCodSec !== -1 ? detectedCodSec : 5;
            colMap.nomeAdmin = detectedNomeSec !== -1 ? detectedNomeSec : 6;
            colMap.email = detectedEmail !== -1 ? detectedEmail : 7;
          }
        }
        continue;
      }
    }

    if (parts.length < 4) {
      result.erros.push(`Linha ${lineIndex + 1}: Quantidade insuficiente de colunas (esperado pelo menos 4).`);
      continue;
    }

    // 2. Extração inteligente e à prova de falhas com base no formato oficial dos campos
    let matricula = (parts[colMap.matricula] || parts[0] || '').trim();
    let nome = (parts[colMap.nome] || parts[1] || '').trim();
    let celularOriginal = (parts[colMap.celular] || parts[2] || '').trim();
    let dataAdmRaw = (parts[colMap.dataAdm] || parts[3] || '').trim();

    let cargoRaw = '';
    let cpfRaw = '';
    let codSecretariaRaw = '';
    let nomeSecretariaRaw = '';
    let emailRaw = '';

    // Se temos 9 ou mais colunas (formato oficial com Cargo)
    if (parts.length >= 9) {
      // Verifica se o CPF está na posição 5 (padrão com cargo na pos 4)
      const pos4IsCpf = limparCaracteres(parts[4] || '').length === 11;
      const pos5IsCpf = limparCaracteres(parts[5] || '').length === 11;

      if (pos5IsCpf || (!pos4IsCpf && parts[4])) {
        // Padrão oficial: cargo na coluna 4, cpf na coluna 5
        cargoRaw = (parts[colMap.cargo !== -1 ? colMap.cargo : 4] || '').trim();
        cpfRaw = (parts[colMap.cpf !== -1 ? colMap.cpf : 5] || '').trim();
        codSecretariaRaw = (parts[colMap.codAdmin !== -1 ? colMap.codAdmin : 6] || '').trim();
        nomeSecretariaRaw = (parts[colMap.nomeAdmin !== -1 ? colMap.nomeAdmin : 7] || '').trim();
        emailRaw = (parts[colMap.email !== -1 ? colMap.email : 8] || '').trim();
      } else if (pos4IsCpf) {
        // Formato antigo sem cargo: cpf na coluna 4
        cargoRaw = 'Servidor Municipal';
        cpfRaw = (parts[4] || '').trim();
        codSecretariaRaw = (parts[5] || '').trim();
        nomeSecretariaRaw = (parts[6] || '').trim();
        emailRaw = (parts[7] || '').trim();
      } else {
        cargoRaw = (parts[4] || '').trim();
        cpfRaw = (parts[5] || '').trim();
        codSecretariaRaw = (parts[6] || '').trim();
        nomeSecretariaRaw = (parts[7] || '').trim();
        emailRaw = (parts[8] || '').trim();
      }
    } else if (parts.length === 8) {
      // 8 colunas: verificar se é formato sem cargo
      const pos4IsCpf = limparCaracteres(parts[4] || '').length === 11;
      if (pos4IsCpf) {
        cargoRaw = 'Servidor Municipal';
        cpfRaw = (parts[4] || '').trim();
        codSecretariaRaw = (parts[5] || '').trim();
        nomeSecretariaRaw = (parts[6] || '').trim();
        emailRaw = (parts[7] || '').trim();
      } else {
        cargoRaw = (parts[4] || '').trim();
        cpfRaw = (parts[5] || '').trim();
        codSecretariaRaw = (parts[6] || '').trim();
        nomeSecretariaRaw = (parts[7] || '').trim();
      }
    } else {
      // Formato compacto
      cpfRaw = (parts[4] || '').trim();
      codSecretariaRaw = (parts[5] || '').trim();
      nomeSecretariaRaw = (parts[6] || '').trim();
    }

    // 3. REGRA DE SEGURANÇA ABSOLUTA CONTRA CPF VIRAR SECRETARIA:
    // Nunca permita que um CPF seja interpretado como código de secretaria!
    const codLimpo = limparCaracteres(codSecretariaRaw);
    const cpfLimpo = limparCaracteres(cpfRaw);

    // Se por acaso o código da secretaria tiver 11 dígitos e o CPF estiver vazio ou incompleto,
    // significa que os campos foram invertidos
    if (codLimpo.length === 11 && cpfLimpo.length !== 11) {
      const tempCpf = codSecretariaRaw;
      codSecretariaRaw = cpfRaw;
      cpfRaw = tempCpf;
    }

    if (!matricula || !nome) {
      continue;
    }

    // Evita duplicatas dentro do mesmo arquivo
    if (matriculasSet.has(matricula)) {
      continue;
    }
    matriculasSet.add(matricula);

    // Tratamento de telefone conforme regra oficial
    const { telefone, formatado } = formatarTelefoneCSV(celularOriginal);
    if (formatado) {
      result.telefonesValidos++;
    } else {
      result.telefonesIgnorados++;
    }

    // Tratamento de data de admissão
    const data_admissao = parseDataAdmissaoCSV(dataAdmRaw);

    // Tratamento de CPF
    const finalCpfDigits = limparCaracteres(cpfRaw);
    const cpfFormatado = finalCpfDigits.length === 11 ? formatarCPF(finalCpfDigits) : cpfRaw;

    // Tratamento da Secretaria e Órgão
    // O código deve ser numérico limpo de 1 a 4 dígitos (ex: 001, 005)
    let rawCodClean = limparCaracteres(codSecretariaRaw);
    if (rawCodClean.length > 4) {
      // Se for maior que 4 dígitos, não é um código válido de secretaria
      rawCodClean = '';
    }

    let codSec = '000';
    if (rawCodClean) {
      codSec = rawCodClean.padStart(3, '0');
    }

    // Identificar informações oficiais da secretaria pelo dicionário institucional de Eusébio
    const officialSecInfo = CODIGO_SECRETARIAS_MAP[codSec];
    let siglaSec = officialSecInfo ? officialSecInfo.sigla : '';
    let nomeSec = nomeSecretariaRaw.trim();

    // Se o nome da secretaria veio em branco ou é apenas o código, usa o nome oficial
    if (!nomeSec || /^\d+$/.test(nomeSec)) {
      nomeSec = officialSecInfo?.nome || (codSec !== '000' ? `SECRETARIA MUNICIPAL (CÓD. ${codSec})` : 'GABINETE DO PREFEITO');
    }

    if (!siglaSec) {
      siglaSec = CODIGO_SIGLAS_MAP[codSec] || (codSec !== '000' ? `SEC-${codSec}` : 'GAPRE');
    }

    const secretariaCompleta = `${siglaSec} - ${nomeSec}`;

    // Atualiza mapa de secretarias únicas
    const secKey = codSec !== '000' ? codSec : siglaSec;
    if (!secretariasMap.has(secKey)) {
      secretariasMap.set(secKey, { sigla: siglaSec, nome: nomeSec, count: 0 });
    }
    secretariasMap.get(secKey)!.count++;

    result.rows.push({
      matricula,
      nome,
      telefone,
      telefoneOriginal: celularOriginal,
      telefoneValido: formatado,
      data_admissao,
      cargo: cargoRaw || 'Servidor Municipal',
      cpf: cpfFormatado,
      cod_secretaria: codSec,
      nome_secretaria: nomeSec,
      sigla_secretaria: siglaSec,
      secretaria_completa: secretariaCompleta,
      email: emailRaw,
      status: 'Ativo',
    });
  }

  result.totalRows = result.rows.length;

  // Montar lista de Secretarias Únicas higienizadas
  for (const [codOrSigla, info] of secretariasMap.entries()) {
    const id = /^\d+$/.test(codOrSigla) ? `SEC-${codOrSigla}` : `SEC-${info.sigla}`;
    result.secretarias.push({
      id,
      sigla: info.sigla,
      nome: info.nome,
      codigo: /^\d+$/.test(codOrSigla) ? codOrSigla : '000',
      servidores_count: info.count,
    });
  }

  // Ordenar secretarias por código
  result.secretarias.sort((a, b) => a.codigo.localeCompare(b.codigo));

  return result;
}
