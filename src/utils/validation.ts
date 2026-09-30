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
