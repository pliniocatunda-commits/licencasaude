// server.ts
import express from "express";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import dotenv from "dotenv";

// src/server/database.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// src/utils/validation.ts
function limparCaracteres(valor) {
  return valor.replace(/\D/g, "");
}
function formatarCPF(cpf) {
  const digits = limparCaracteres(cpf).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

// src/utils/csvImporter.ts
var CODIGO_SECRETARIAS_MAP = {
  "001": { sigla: "SEFIN", nome: "SECRETARIA DE FINANCAS E PLANEJAMENTO" },
  "002": { sigla: "SEGOV", nome: "SEC GOV E DESENVOLVIMENTO GESTAO" },
  "003": { sigla: "SEINFRA", nome: "SEC MUN INFRAESTRUTURA E SERVICOS PUBL" },
  "004": { sigla: "SME", nome: "SECRETARIA DE EDUCACAO" },
  "005": { sigla: "SMS", nome: "SECRETARIA MUNICIPAL DA SAUDE" },
  "006": { sigla: "SMDS", nome: "SECRETARIA MUN DESENVOLVIMENTO SOCIAL" },
  "009": { sigla: "GAPRE", nome: "GABINETE DO PREFEITO" },
  "010": { sigla: "PGM", nome: "PROCURADORIA GERAL DO MUNICIPIO" },
  "013": { sigla: "SMSPC", nome: "SECRETARIA MUNICIPAL SEGURANCA PUBLICA" },
  "015": { sigla: "AMT", nome: "AUTARQUIA MUNICIPAL DE TRANSITO" },
  "016": { sigla: "SMEJ", nome: "SECRETARIA MUN ESPORTE E JUVENTUDE" },
  "017": { sigla: "SECULT", nome: "SECRETARIA DE CULTURA E TURISMO" },
  "018": { sigla: "AMMA", nome: "AUTARQUIA MUNICIPAL DO MEIO AMBIENTE" },
  "020": { sigla: "CGM", nome: "CONTROLADORIA E OUVIDORIA GERAL DO MUN" }
};
var CODIGO_SIGLAS_MAP = Object.fromEntries(
  Object.entries(CODIGO_SECRETARIAS_MAP).map(([cod, info]) => [cod, info.sigla])
);
function formatarTelefoneCSV(val) {
  if (!val) return { telefone: "", formatado: false };
  const digits = limparCaracteres(val);
  if (digits.length !== 11) {
    return { telefone: "", formatado: false };
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    return { telefone: "", formatado: false };
  }
  const ddd = digits.slice(0, 2);
  const parte1 = digits.slice(2, 7);
  const parte2 = digits.slice(7);
  return {
    telefone: `(${ddd}) ${parte1}-${parte2}`,
    formatado: true
  };
}
function parseDataAdmissaoCSV(val) {
  if (!val) return "";
  const trimmed = val.trim();
  if (!trimmed) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return "";
}
function parseServidoresCSV(csvText) {
  const result = {
    rows: [],
    secretarias: [],
    totalRows: 0,
    telefonesValidos: 0,
    telefonesIgnorados: 0,
    erros: []
  };
  if (!csvText || !csvText.trim()) {
    result.erros.push("O arquivo CSV est\xE1 vazio.");
    return result;
  }
  const rawLines = csvText.split(/\r?\n/);
  const secretariasMap = /* @__PURE__ */ new Map();
  const matriculasSet = /* @__PURE__ */ new Set();
  let colMap = {
    matricula: 0,
    nome: 1,
    celular: 2,
    dataAdm: 3,
    cargo: 4,
    cpf: 5,
    codAdmin: 6,
    nomeAdmin: 7,
    email: 8
  };
  let hasCustomColMap = false;
  let isFirstLine = true;
  for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
    const rawLine = rawLines[lineIndex].trim();
    if (!rawLine) continue;
    const delimiter = rawLine.includes(";") ? ";" : ",";
    const parts = rawLine.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    if (isFirstLine) {
      isFirstLine = false;
      const lower = rawLine.toLowerCase();
      const isHeader = lower.includes("matr") || lower.includes("nome") || lower.includes("cpf") || lower.includes("cargo") || lower.includes("admin") || lower.includes("secretaria");
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
          if (c.includes("matr") || c === "mat") {
            detectedMatr = idx;
          } else if (c.includes("cargo") || c.includes("fun\xE7\xE3o") || c.includes("funcao")) {
            detectedCargo = idx;
          } else if (c.includes("cpf") || c.includes("cic")) {
            detectedCpf = idx;
          } else if (c.includes("c\xF3d") || c.includes("cod") || c.startsWith("cd.") || c.startsWith("cd ") || c === "cd") {
            detectedCodSec = idx;
          } else if (c.includes("secretaria") || c.includes("admin") || c.includes("\xF3rg\xE3o") || c.includes("orgao") || c.includes("lota\xE7\xE3o") || c.includes("lotacao")) {
            detectedNomeSec = idx;
          } else if (c.includes("cel") || c.includes("tel") || c.includes("fone")) {
            detectedCel = idx;
          } else if (c.includes("adm") || c.includes("data")) {
            detectedAdm = idx;
          } else if (c.includes("mail")) {
            detectedEmail = idx;
          } else if (c.includes("nome") || c.includes("func") || c.includes("serv")) {
            detectedNome = idx;
          }
        });
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
    let matricula = (parts[colMap.matricula] || parts[0] || "").trim();
    let nome = (parts[colMap.nome] || parts[1] || "").trim();
    let celularOriginal = (parts[colMap.celular] || parts[2] || "").trim();
    let dataAdmRaw = (parts[colMap.dataAdm] || parts[3] || "").trim();
    let cargoRaw = "";
    let cpfRaw = "";
    let codSecretariaRaw = "";
    let nomeSecretariaRaw = "";
    let emailRaw = "";
    if (parts.length >= 9) {
      const pos4IsCpf = limparCaracteres(parts[4] || "").length === 11;
      const pos5IsCpf = limparCaracteres(parts[5] || "").length === 11;
      if (pos5IsCpf || !pos4IsCpf && parts[4]) {
        cargoRaw = (parts[colMap.cargo !== -1 ? colMap.cargo : 4] || "").trim();
        cpfRaw = (parts[colMap.cpf !== -1 ? colMap.cpf : 5] || "").trim();
        codSecretariaRaw = (parts[colMap.codAdmin !== -1 ? colMap.codAdmin : 6] || "").trim();
        nomeSecretariaRaw = (parts[colMap.nomeAdmin !== -1 ? colMap.nomeAdmin : 7] || "").trim();
        emailRaw = (parts[colMap.email !== -1 ? colMap.email : 8] || "").trim();
      } else if (pos4IsCpf) {
        cargoRaw = "Servidor Municipal";
        cpfRaw = (parts[4] || "").trim();
        codSecretariaRaw = (parts[5] || "").trim();
        nomeSecretariaRaw = (parts[6] || "").trim();
        emailRaw = (parts[7] || "").trim();
      } else {
        cargoRaw = (parts[4] || "").trim();
        cpfRaw = (parts[5] || "").trim();
        codSecretariaRaw = (parts[6] || "").trim();
        nomeSecretariaRaw = (parts[7] || "").trim();
        emailRaw = (parts[8] || "").trim();
      }
    } else if (parts.length === 8) {
      const pos4IsCpf = limparCaracteres(parts[4] || "").length === 11;
      if (pos4IsCpf) {
        cargoRaw = "Servidor Municipal";
        cpfRaw = (parts[4] || "").trim();
        codSecretariaRaw = (parts[5] || "").trim();
        nomeSecretariaRaw = (parts[6] || "").trim();
        emailRaw = (parts[7] || "").trim();
      } else {
        cargoRaw = (parts[4] || "").trim();
        cpfRaw = (parts[5] || "").trim();
        codSecretariaRaw = (parts[6] || "").trim();
        nomeSecretariaRaw = (parts[7] || "").trim();
      }
    } else {
      cpfRaw = (parts[4] || "").trim();
      codSecretariaRaw = (parts[5] || "").trim();
      nomeSecretariaRaw = (parts[6] || "").trim();
    }
    const codLimpo = limparCaracteres(codSecretariaRaw);
    const cpfLimpo = limparCaracteres(cpfRaw);
    if (codLimpo.length === 11 && cpfLimpo.length !== 11) {
      const tempCpf = codSecretariaRaw;
      codSecretariaRaw = cpfRaw;
      cpfRaw = tempCpf;
    }
    if (!matricula || !nome) {
      continue;
    }
    if (matriculasSet.has(matricula)) {
      continue;
    }
    matriculasSet.add(matricula);
    const { telefone, formatado } = formatarTelefoneCSV(celularOriginal);
    if (formatado) {
      result.telefonesValidos++;
    } else {
      result.telefonesIgnorados++;
    }
    const data_admissao = parseDataAdmissaoCSV(dataAdmRaw);
    const finalCpfDigits = limparCaracteres(cpfRaw);
    const cpfFormatado = finalCpfDigits.length === 11 ? formatarCPF(finalCpfDigits) : cpfRaw;
    let rawCodClean = limparCaracteres(codSecretariaRaw);
    if (rawCodClean.length > 4) {
      rawCodClean = "";
    }
    let codSec = "000";
    if (rawCodClean) {
      codSec = rawCodClean.padStart(3, "0");
    }
    const officialSecInfo = CODIGO_SECRETARIAS_MAP[codSec];
    let siglaSec = officialSecInfo ? officialSecInfo.sigla : "";
    let nomeSec = nomeSecretariaRaw.trim();
    if (!nomeSec || /^\d+$/.test(nomeSec)) {
      nomeSec = officialSecInfo?.nome || (codSec !== "000" ? `SECRETARIA MUNICIPAL (C\xD3D. ${codSec})` : "GABINETE DO PREFEITO");
    }
    if (!siglaSec) {
      siglaSec = CODIGO_SIGLAS_MAP[codSec] || (codSec !== "000" ? `SEC-${codSec}` : "GAPRE");
    }
    const secretariaCompleta = `${siglaSec} - ${nomeSec}`;
    const secKey = codSec !== "000" ? codSec : siglaSec;
    if (!secretariasMap.has(secKey)) {
      secretariasMap.set(secKey, { sigla: siglaSec, nome: nomeSec, count: 0 });
    }
    secretariasMap.get(secKey).count++;
    result.rows.push({
      matricula,
      nome,
      telefone,
      telefoneOriginal: celularOriginal,
      telefoneValido: formatado,
      data_admissao,
      cargo: cargoRaw || "Servidor Municipal",
      cpf: cpfFormatado,
      cod_secretaria: codSec,
      nome_secretaria: nomeSec,
      sigla_secretaria: siglaSec,
      secretaria_completa: secretariaCompleta,
      email: emailRaw,
      status: "Ativo"
    });
  }
  result.totalRows = result.rows.length;
  for (const [codOrSigla, info] of secretariasMap.entries()) {
    const id = /^\d+$/.test(codOrSigla) ? `SEC-${codOrSigla}` : `SEC-${info.sigla}`;
    result.secretarias.push({
      id,
      sigla: info.sigla,
      nome: info.nome,
      codigo: /^\d+$/.test(codOrSigla) ? codOrSigla : "000",
      servidores_count: info.count
    });
  }
  result.secretarias.sort((a, b) => a.codigo.localeCompare(b.codigo));
  return result;
}

// src/server/database.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var DATA_DIR = path.resolve(__dirname, "../../data");
var DB_FILE = path.join(DATA_DIR, "ipme_database.json");
var TENANTS_DIR = path.join(DATA_DIR, "tenants");
var REGISTRY_FILE = path.join(DATA_DIR, "tenants_registry.json");
var DEFAULT_TENANTS = [
  {
    id: "ipme_eusebio",
    nome: "IPME - Instituto de Previd\xEAncia do Munic\xEDpio de Eus\xE9bio",
    sigla: "IPME Eus\xE9bio",
    cnpj: "05.123.456/0001-78",
    cidade: "Eus\xE9bio",
    uf: "CE",
    ambiente: "producao",
    ativo: true,
    created_at: "2026-01-01T08:00:00.000Z",
    descricao: "Base Oficial de Produ\xE7\xE3o Previdenci\xE1ria do Munic\xEDpio de Eus\xE9bio - CE. Isolada e auditada."
  },
  {
    id: "studio_sandbox",
    nome: "Ambiente de Testes & Homologa\xE7\xE3o Studio",
    sigla: "Studio Sandbox",
    cnpj: "00.000.000/0001-00",
    cidade: "Eus\xE9bio (Ambiente de Testes)",
    uf: "CE",
    ambiente: "homologacao",
    ativo: true,
    created_at: "2026-01-01T08:00:00.000Z",
    descricao: "Ambiente seguro para testes no Google AI Studio. Os testes aqui realizados NUNCA afetam a base oficial do cliente."
  }
];
var DEFAULT_USERS = [
  {
    id: "user_master_admin",
    email: "Pliniocatunda@gmail.com",
    name: "Pl\xEDnio Catunda",
    role: "admin",
    auth_provider: "google",
    department: "IPME - Presid\xEAncia & Governan\xE7a",
    cargo: "Diretor-Presidente do IPME",
    funcao_pericial: "Diretor-Presidente do Instituto",
    is_presidente: true,
    avatar_url: "/logo-ipme.png",
    created_at: "2026-01-01T08:00:00.000Z",
    password: "IpmeMaster@2026",
    email_verified: true,
    must_change_password: false
  },
  {
    id: "user_perito_medico",
    email: "medico.perito@eusebio.ce.gov.br",
    name: "Dr. Marcelo Cavalcante Holanda",
    role: "operator",
    auth_provider: "corporate",
    department: "IPME - Junta M\xE9dica Pericial",
    cargo: "M\xE9dico Perito Oficial",
    funcao_pericial: "Coordenador da Junta M\xE9dica Pericial Oficial",
    is_presidente: false,
    avatar_url: "/src/assets/images/avatar_perito_1790337176942.jpg",
    created_at: "2026-01-15T09:30:00.000Z",
    password: "Perito@2026",
    email_verified: true,
    must_change_password: false
  },
  {
    id: "user_rh_operador",
    email: "rh.operador@eusebio.ce.gov.br",
    name: "Mariana Vasconcelos de Albuquerque",
    role: "operator",
    auth_provider: "corporate",
    department: "SME / IPME - Recursos Humanos & Benef\xEDcios",
    cargo: "Analista de Recursos Humanos",
    funcao_pericial: "Coordena\xE7\xE3o de Gest\xE3o de Pessoas & DHO",
    is_presidente: false,
    created_at: "2026-02-01T10:00:00.000Z",
    password: "RhOperador@2026",
    email_verified: true,
    must_change_password: false
  }
];
var DEFAULT_EMPLOYEES = [
  {
    matricula: "EUS-01042",
    nome: "Maria das Gra\xE7as Alencar",
    cpf: "452.891.033-72",
    telefone: "(85) 98842-1109",
    secretaria: "SME - Secretaria Municipal de Educa\xE7\xE3o",
    setor: "Escola Municipal Neusa de Freitas S\xE1",
    cargo: "Professor de Educa\xE7\xE3o B\xE1sica II",
    status: "Licenciado",
    data_admissao: "2014-03-10",
    email: "maria.alencar@eusebio.ce.gov.br",
    created_at: "2026-01-10T10:00:00.000Z",
    updated_at: "2026-08-15T14:20:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  },
  {
    matricula: "EUS-02115",
    nome: "Francisco Antunes de Oliveira",
    cpf: "619.340.283-91",
    telefone: "(85) 99123-4567",
    secretaria: "SMS - Secretaria Municipal de Sa\xFAde",
    setor: "Hospital Municipal Amadeu S\xE1",
    cargo: "Enfermeiro Plantonista",
    status: "Licenciado",
    data_admissao: "2016-07-01",
    email: "francisco.oliveira@eusebio.ce.gov.br",
    created_at: "2026-02-12T09:00:00.000Z",
    updated_at: "2026-09-01T11:15:00.000Z",
    created_by: "medico.perito@eusebio.ce.gov.br"
  },
  {
    matricula: "EUS-03089",
    nome: "Ana Patr\xEDcia Gomes da Silva",
    cpf: "832.190.473-50",
    telefone: "(85) 98765-4321",
    secretaria: "SEFIN - Secretaria Municipal de Finan\xE7as",
    setor: "Coordena\xE7\xE3o de Arrecada\xE7\xE3o e IPTU",
    cargo: "Assistente Administrativo",
    status: "Readaptado",
    data_admissao: "2018-02-15",
    email: "ana.silva@eusebio.ce.gov.br",
    created_at: "2026-01-20T11:30:00.000Z",
    updated_at: "2026-07-10T16:45:00.000Z",
    created_by: "rh.operador@eusebio.ce.gov.br"
  },
  {
    matricula: "EUS-04192",
    nome: "Jos\xE9 Roberto Cavalcante",
    cpf: "304.782.913-68",
    telefone: "(85) 99654-7890",
    secretaria: "SMSPC - Secretaria de Seguran\xE7a P\xFAblica e Cidadania",
    setor: "Guarda Municipal / Ronda Ostensiva Escolar",
    cargo: "Guarda Municipal 1\xAA Classe",
    status: "Readaptado",
    data_admissao: "2012-05-20",
    email: "roberto.cavalcante@eusebio.ce.gov.br",
    created_at: "2026-01-18T14:10:00.000Z",
    updated_at: "2026-06-05T09:30:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  },
  {
    matricula: "EUS-05230",
    nome: "Raimunda Nonata Bezerra",
    cpf: "571.209.833-44",
    telefone: "(85) 98456-1234",
    secretaria: "SMS - Secretaria Municipal de Sa\xFAde",
    setor: "UBS Novo Portugal",
    cargo: "Agente Comunit\xE1rio de Sa\xFAde",
    status: "Ativo",
    data_admissao: "2015-11-03",
    email: "nonata.bezerra@eusebio.ce.gov.br",
    created_at: "2026-02-05T08:45:00.000Z",
    updated_at: "2026-02-05T08:45:00.000Z",
    created_by: "rh.operador@eusebio.ce.gov.br"
  },
  {
    matricula: "EUS-06114",
    nome: "Carlos Eduardo de Sousa",
    cpf: "728.940.163-15",
    telefone: "(85) 99789-3210",
    secretaria: "SMS - Secretaria Municipal de Sa\xFAde",
    setor: "Central de Transporte Sanit\xE1rio",
    cargo: "Motorista de Ambul\xE2ncia",
    status: "Ativo",
    data_admissao: "2019-09-16",
    email: "carlos.sousa@eusebio.ce.gov.br",
    created_at: "2026-02-18T13:20:00.000Z",
    updated_at: "2026-08-30T10:15:00.000Z",
    created_by: "medico.perito@eusebio.ce.gov.br"
  },
  {
    matricula: "EUS-07340",
    nome: "Sandra Helena Pinheiro",
    cpf: "190.543.823-26",
    telefone: "(85) 98822-9900",
    secretaria: "SMS - Secretaria Municipal de Sa\xFAde",
    setor: "CAPS II Eus\xE9bio",
    cargo: "T\xE9cnica em Enfermagem",
    status: "Ativo",
    data_admissao: "2020-01-10",
    email: "sandra.pinheiro@eusebio.ce.gov.br",
    created_at: "2026-03-01T09:10:00.000Z",
    updated_at: "2026-03-01T09:10:00.000Z",
    created_by: "rh.operador@eusebio.ce.gov.br"
  },
  {
    matricula: "EUS-08422",
    nome: "Ant\xF4nio Marcos Furtado",
    cpf: "921.408.373-85",
    telefone: "(85) 99111-2233",
    secretaria: "SEINFRA - Secretaria de Infraestrutura e Obras",
    setor: "Departamento de Fiscaliza\xE7\xE3o Urbana",
    cargo: "Fiscal de Obras e Posturas",
    status: "Ativo",
    data_admissao: "2017-04-12",
    email: "antonio.furtado@eusebio.ce.gov.br",
    created_at: "2026-03-12T15:00:00.000Z",
    updated_at: "2026-03-12T15:00:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  },
  {
    matricula: "EUS-09156",
    nome: "Juliana Ferreira Lima",
    cpf: "243.678.913-02",
    telefone: "(85) 98712-3498",
    secretaria: "SME - Secretaria Municipal de Educa\xE7\xE3o",
    setor: "CEI Maria Tavares de Miranda",
    cargo: "Coordenadora Pedag\xF3gica",
    status: "Ativo",
    data_admissao: "2013-08-01",
    email: "juliana.lima@eusebio.ce.gov.br",
    created_at: "2026-03-15T11:00:00.000Z",
    updated_at: "2026-03-15T11:00:00.000Z",
    created_by: "rh.operador@eusebio.ce.gov.br"
  },
  {
    matricula: "EUS-10287",
    nome: "Paulo Henrique Mendes",
    cpf: "810.923.453-67",
    telefone: "(85) 99933-7744",
    secretaria: "IPME - Instituto de Previd\xEAncia do Munic\xEDpio de Eus\xE9bio",
    setor: "Diretoria de Benef\xEDcios Previdenci\xE1rios",
    cargo: "Analista Previdenci\xE1rio",
    status: "Ativo",
    data_admissao: "2021-06-01",
    email: "paulo.mendes@eusebio.ce.gov.br",
    created_at: "2026-03-20T16:30:00.000Z",
    updated_at: "2026-03-20T16:30:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  }
];
var DEFAULT_OCCURRENCES = [
  {
    id: "1",
    matricula: "EUS-01042",
    employee_nome: "Maria das Gra\xE7as Alencar",
    employee_cargo: "Professor de Educa\xE7\xE3o B\xE1sica II",
    employee_secretaria: "SME - Secretaria Municipal de Educa\xE7\xE3o",
    tipo: "Licen\xE7a Sa\xFAde",
    data_inicio: "2026-08-15",
    data_termino: "2026-10-13",
    data_termino_inicial: "2026-10-13",
    quantidade_dias: 60,
    cid: "F32.1 - Epis\xF3dio depressivo moderado",
    medico_perito: "Dr. Marcelo Cavalcante Holanda",
    crm: "CRM/CE 14.890",
    status: "Ativa",
    anexo_nome: "Atestado_Pericia_Oficial_01042.pdf",
    observacoes: "Servidora apresentou quadro severo de exaust\xE3o e depress\xE3o moderada decorrente de estresse em sala de aula.",
    parecer_tecnico: "Junta M\xE9dica IPME homologou 60 dias de afastamento integral para tratamento psicoterap\xEAutico e farmacol\xF3gico. Retorno previsto com reavalia\xE7\xE3o pericial.",
    prorrogacoes: [],
    created_at: "2026-08-15T14:20:00.000Z",
    updated_at: "2026-08-15T14:20:00.000Z",
    created_by: "medico.perito@eusebio.ce.gov.br"
  },
  {
    id: "2",
    matricula: "EUS-02115",
    employee_nome: "Francisco Antunes de Oliveira",
    employee_cargo: "Enfermeiro Plantonista",
    employee_secretaria: "SMS - Secretaria Municipal de Sa\xFAde",
    tipo: "Licen\xE7a Sa\xFAde",
    data_inicio: "2026-07-20",
    data_termino: "2026-10-05",
    data_termino_inicial: "2026-09-02",
    quantidade_dias: 78,
    cid: "M54.5 - Dor lombar baixa (Lombalgia)",
    medico_perito: "Dra. Camila Nogueira Dantas",
    crm: "CRM/CE 19.340",
    status: "Prorrogada",
    anexo_nome: "Ressonancia_Lombossacra_02115.pdf",
    observacoes: "H\xE9rnia de disco L4-L5 incapacitante para movimenta\xE7\xE3o de pacientes em leito hospitalar.",
    parecer_tecnico: "Licen\xE7a inicial concedida por 45 dias em 20/07/2026. Prorrogada em 01/09/2026 por mais 33 dias ap\xF3s reavalia\xE7\xE3o com laudo de resson\xE2ncia magn\xE9tica demonstrando compress\xE3o radicular ativa.",
    prorrogacoes: [
      {
        id: "PRORR-2-1",
        sequencial: 1,
        data_anterior_termino: "2026-09-02",
        nova_data_termino: "2026-10-05",
        dias_adicionados: 33,
        dias_totais_acumulados: 78,
        dias_pagos_acumulados: 63,
        motivo: "Reavalia\xE7\xE3o pericial com laudo de resson\xE2ncia magn\xE9tica demonstrando compress\xE3o radicular ativa em L4-L5. Recomendada extens\xE3o do repouso e sess\xF5es fisioter\xE1picas especializadas.",
        medico_perito: "Dra. Camila Nogueira Dantas",
        crm: "CRM/CE 19.340",
        created_at: "2026-09-01T11:15:00.000Z",
        created_by: "medico.perito@eusebio.ce.gov.br"
      }
    ],
    created_at: "2026-07-20T09:00:00.000Z",
    updated_at: "2026-09-01T11:15:00.000Z",
    created_by: "medico.perito@eusebio.ce.gov.br"
  },
  {
    id: "3",
    matricula: "EUS-03089",
    employee_nome: "Ana Patr\xEDcia Gomes da Silva",
    employee_cargo: "Assistente Administrativo",
    employee_secretaria: "SEFIN - Secretaria Municipal de Finan\xE7as",
    tipo: "Readapta\xE7\xE3o",
    data_inicio: "2026-07-10",
    data_termino: "2027-01-06",
    quantidade_dias: 180,
    cid: "G56.0 - S\xEDndrome do t\xFAnel do carpo",
    medico_perito: "Dr. Roberto Bezerra Filho",
    crm: "CRM/CE 12.115",
    status: "Ativa",
    anexo_nome: "Laudo_Eletroneuromiografia_03089.pdf",
    observacoes: "Restri\xE7\xE3o de esfor\xE7os repetitivos e digita\xE7\xE3o cont\xEDnua superior a 2 horas di\xE1rias.",
    parecer_tecnico: "Comiss\xE3o Especial de Readapta\xE7\xE3o do IPME definiu remanejamento interno: a servidora foi alocada na recep\xE7\xE3o ao contribuinte e confer\xEAncia f\xEDsica de certid\xF5es, isenta de digita\xE7\xE3o ininterrupta.",
    created_at: "2026-07-10T16:45:00.000Z",
    updated_at: "2026-07-10T16:45:00.000Z",
    created_by: "rh.operador@eusebio.ce.gov.br"
  },
  {
    id: "4",
    matricula: "EUS-04192",
    employee_nome: "Jos\xE9 Roberto Cavalcante",
    employee_cargo: "Guarda Municipal 1\xAA Classe",
    employee_secretaria: "SMSPC - Secretaria de Seguran\xE7a P\xFAblica e Cidadania",
    tipo: "Readapta\xE7\xE3o",
    data_inicio: "2026-06-05",
    data_termino: "2027-06-04",
    quantidade_dias: 365,
    cid: "M75.1 - S\xEDndrome do manguito rotador",
    medico_perito: "Dra. Camila Nogueira Dantas",
    crm: "CRM/CE 19.340",
    status: "Ativa",
    anexo_nome: "Laudo_Junta_Medica_Seguranca_04192.pdf",
    observacoes: "Impossibilitado de realizar rondas externas armadas e carregar colete bal\xEDstico pesado por mais de 4 horas.",
    parecer_tecnico: "Parecer favor\xE1vel \xE0 readapta\xE7\xE3o tempor\xE1ria por 12 meses na Central Integrada de Opera\xE7\xF5es de Seguran\xE7a (CIOPS Eus\xE9bio), operando monitoramento por c\xE2meras de v\xEDdeo em ambiente climatizado.",
    created_at: "2026-06-05T09:30:00.000Z",
    updated_at: "2026-06-05T09:30:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  },
  {
    id: "5",
    matricula: "EUS-06114",
    employee_nome: "Carlos Eduardo de Sousa",
    employee_cargo: "Motorista de Ambul\xE2ncia",
    employee_secretaria: "SMS - Secretaria Municipal de Sa\xFAde",
    tipo: "Licen\xE7a Sa\xFAde",
    data_inicio: "2026-05-10",
    data_termino: "2026-08-08",
    quantidade_dias: 90,
    cid: "S52.5 - Fratura da extremidade inferior do r\xE1dio",
    medico_perito: "Dr. Marcelo Cavalcante Holanda",
    crm: "CRM/CE 14.890",
    status: "Conclu\xEDda",
    anexo_nome: "Alta_Medica_Ortopedia_06114.pdf",
    observacoes: "Acidente extra-laboral com fratura em punho direito tratada cirurgicamente com placa de tit\xE2nio.",
    parecer_tecnico: "Tratamento fisioter\xE1pico conclu\xEDdo com sucesso. Per\xEDcia de retorno realizada em 08/08/2026 constatou recupera\xE7\xE3o completa da for\xE7a e amplitude de movimento. Apto para reassumir dire\xE7\xE3o de viatura de emerg\xEAncia.",
    created_at: "2026-05-10T11:00:00.000Z",
    updated_at: "2026-08-30T10:15:00.000Z",
    created_by: "medico.perito@eusebio.ce.gov.br"
  }
];
var DEFAULT_AUDIT_LOGS = [
  {
    id: "audit_001",
    entity_type: "employee",
    entity_id: "EUS-01042",
    action: "UPDATE",
    details: 'Status do servidor alterado de "Ativo" para "Licenciado" devido ao in\xEDcio da Licen\xE7a Sa\xFAde ID 1.',
    changed_by: "medico.perito@eusebio.ce.gov.br",
    user_role: "operator",
    timestamp: "2026-08-15T14:20:00.000Z"
  },
  {
    id: "audit_002",
    entity_type: "occurrence",
    entity_id: "2",
    action: "PRORROGAR",
    details: "Prorroga\xE7\xE3o de 33 dias homologada pela Dra. Camila Nogueira Dantas para ocorr\xEAncia ID 2. Novo t\xE9rmino: 05/10/2026.",
    changed_by: "medico.perito@eusebio.ce.gov.br",
    user_role: "operator",
    timestamp: "2026-09-01T11:15:00.000Z"
  },
  {
    id: "audit_003",
    entity_type: "occurrence",
    entity_id: "5",
    action: "CONCLUIR",
    details: "Licen\xE7a m\xE9dica ID 5 conclu\xEDda ap\xF3s per\xEDcia de retorno. Servidor Carlos Eduardo de Sousa retornou ao status Ativo.",
    changed_by: "medico.perito@eusebio.ce.gov.br",
    user_role: "operator",
    timestamp: "2026-08-30T10:15:00.000Z"
  },
  {
    id: "audit_004",
    entity_type: "employee",
    entity_id: "EUS-03089",
    action: "UPDATE",
    details: "Servidora Ana Patr\xEDcia Gomes da Silva readaptada funcionalmente para atendimento presencial e confer\xEAncia documental.",
    changed_by: "rh.operador@eusebio.ce.gov.br",
    user_role: "operator",
    timestamp: "2026-07-10T16:45:00.000Z"
  },
  {
    id: "audit_005",
    entity_type: "user",
    entity_id: "Pliniocatunda@gmail.com",
    action: "CREATE",
    details: "Cadastro e ativa\xE7\xE3o do Superusu\xE1rio Administrador Geral IPME.",
    changed_by: "Sistema IPME",
    user_role: "admin",
    timestamp: "2026-01-01T08:00:00.000Z"
  }
];
var DEFAULT_SECRETARIAS = [
  {
    id: "SEC-SME",
    sigla: "SME",
    nome: "Secretaria Municipal de Educa\xE7\xE3o",
    secretario: "Profa. Josete Maria de Holanda",
    email: "educacao@eusebio.ce.gov.br",
    telefone: "(85) 3260-1510",
    endereco: "Rua Irm\xE3 Ambrosina, 260 - Centro, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SMS",
    sigla: "SMS",
    nome: "Secretaria Municipal de Sa\xFAde",
    secretario: "Dr. Josu\xE9 de Castro",
    email: "saude@eusebio.ce.gov.br",
    telefone: "(85) 3260-1920",
    endereco: "Av. Eduardo S\xE1, 150 - Urucunema, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SEFIN",
    sigla: "SEFIN",
    nome: "Secretaria Municipal de Finan\xE7as",
    secretario: "Alexandre Cordeiro Maia",
    email: "financas@eusebio.ce.gov.br",
    telefone: "(85) 3260-2200",
    endereco: "Rua Prefeito Almir de Freitas, 10 - Centro, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SDS",
    sigla: "SDS",
    nome: "Secretaria de Desenvolvimento Social",
    secretario: "Michele Queiroz Rocha",
    email: "social@eusebio.ce.gov.br",
    telefone: "(85) 3260-3100",
    endereco: "Rua Carmelita Rebou\xE7as, 115 - Centro, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SEINFRA",
    sigla: "SEINFRA",
    nome: "Secretaria de Infraestrutura e Obras",
    secretario: "Eng. Sebasti\xE3o Albuquerque",
    email: "obras@eusebio.ce.gov.br",
    telefone: "(85) 3260-4400",
    endereco: "Rua Jos\xE9 Guimar\xE3es, 45 - Parque Hava\xED, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SEAD",
    sigla: "SEAD",
    nome: "Secretaria de Administra\xE7\xE3o e Planejamento",
    secretario: "Rodrigo Medeiros Fonteles",
    email: "administracao@eusebio.ce.gov.br",
    telefone: "(85) 3260-5500",
    endereco: "Rua Prefeito Almir de Freitas, 10 - Centro, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SMSPC",
    sigla: "SMSPC",
    nome: "Secretaria de Seguran\xE7a P\xFAblica e Cidadania",
    secretario: "Cel. Lauro Prado",
    email: "seguranca@eusebio.ce.gov.br",
    telefone: "(85) 3260-6600",
    endereco: "Av. Eus\xE9bio de Queiroz, 2400 - Tamatanduba, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SECULT",
    sigla: "SECULT",
    nome: "Secretaria de Cultura e Turismo",
    secretario: "Tarc\xEDsio da Silva Christiane",
    email: "cultura@eusebio.ce.gov.br",
    telefone: "(85) 3260-7700",
    endereco: "Av. Eus\xE9bio de Queiroz, 460 - Centro, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-SEMA",
    sigla: "SEMA",
    nome: "Secretaria de Meio Ambiente e Urbanismo",
    secretario: "B\xE1rbara Cavalcante Pontes",
    email: "meioambiente@eusebio.ce.gov.br",
    telefone: "(85) 3260-8800",
    endereco: "Rua Edmilson Pinheiro, 80 - Aut\xF3dromo, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-GAB",
    sigla: "GAB",
    nome: "Gabinete do Prefeito",
    secretario: "Chefe de Gabinete",
    email: "gabinete@eusebio.ce.gov.br",
    telefone: "(85) 3260-1000",
    endereco: "Rua Prefeito Almir de Freitas, 10 - Centro, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  },
  {
    id: "SEC-IPME",
    sigla: "IPME",
    nome: "Instituto de Previd\xEAncia do Munic\xEDpio de Eus\xE9bio",
    secretario: "Diretoria Executiva Previdenci\xE1ria",
    email: "atendimento@ipme.ce.gov.br",
    telefone: "(85) 3260-9900",
    endereco: "Rua Irm\xE3 Ambrosina, 85 - Centro, Eus\xE9bio - CE",
    ativa: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Sistema IPME"
  }
];
var DEFAULT_DOCTORS = [
  {
    id: "1",
    nome: "Dr. Marcelo Cavalcante Holanda",
    crm: "CRM/CE 14.892",
    especialidade: "Medicina do Trabalho / Per\xEDcia M\xE9dica Oficial",
    vinculo: "Efetivo",
    is_diretor: true,
    ativo: true,
    created_at: "2026-01-01T08:00:00.000Z",
    updated_at: "2026-01-01T08:00:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  },
  {
    id: "2",
    nome: "Dra. Juliana Vasconcelos Pontes",
    crm: "CRM/CE 18.234",
    especialidade: "Cl\xEDnica M\xE9dica / Per\xEDcia Previdenci\xE1ria",
    vinculo: "Comissionado",
    is_diretor: false,
    ativo: true,
    created_at: "2026-01-05T09:00:00.000Z",
    updated_at: "2026-01-05T09:00:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  },
  {
    id: "3",
    nome: "Dr. Roberto Mendes Sampaio",
    crm: "CRM/CE 12.450",
    especialidade: "Ortopedia e Traumatologia",
    vinculo: "Efetivo",
    is_diretor: false,
    ativo: true,
    created_at: "2026-01-10T10:00:00.000Z",
    updated_at: "2026-01-10T10:00:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  },
  {
    id: "4",
    nome: "Dra. Camila Nogueira Dantas",
    crm: "CRM/CE 21.089",
    especialidade: "Psiquiatria Ocupacional",
    vinculo: "Tempor\xE1rio",
    is_diretor: false,
    ativo: true,
    created_at: "2026-01-15T14:30:00.000Z",
    updated_at: "2026-01-15T14:30:00.000Z",
    created_by: "Pliniocatunda@gmail.com"
  }
];
var TenantDatabaseScope = class {
  constructor(manager, tenantId) {
    this.manager = manager;
    this.tenantId = tenantId;
  }
  getEmployees(search, secretaria, status) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getEmployees(search, secretaria, status));
  }
  getEmployeeByMatricula(matricula) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getEmployeeByMatricula(matricula));
  }
  saveEmployee(emp, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.saveEmployee(emp, actorEmail, actorRole));
  }
  deleteEmployee(matricula, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.deleteEmployee(matricula, actorEmail, actorRole));
  }
  clearAllEmployees(actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.clearAllEmployees(actorEmail, actorRole));
  }
  getOccurrences(matricula, tipo, status, dataInicio, dataTermino) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getOccurrences(matricula, tipo, status, dataInicio, dataTermino));
  }
  getOccurrenceById(id) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getOccurrenceById(id));
  }
  saveOccurrence(occ, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.saveOccurrence(occ, actorEmail, actorRole));
  }
  prorrogarOccurrence(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.prorrogarOccurrence(...args));
  }
  concluirOccurrence(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.concluirOccurrence(...args));
  }
  retornarTrabalhoOccurrence(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.retornarTrabalhoOccurrence(...args));
  }
  converterOccurrenceDefinitiva(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.converterOccurrenceDefinitiva(...args));
  }
  cancelarOccurrence(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.cancelarOccurrence(...args));
  }
  deleteOccurrence(id, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.deleteOccurrence(id, actorEmail, actorRole));
  }
  clearOccurrences(actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.clearOccurrences(actorEmail, actorRole));
  }
  getDoctors(search, ativoOnly) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getDoctors(search, ativoOnly));
  }
  getDoctorById(idOrCrm) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getDoctorById(idOrCrm));
  }
  saveDoctor(doc, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.saveDoctor(doc, actorEmail, actorRole));
  }
  deleteDoctor(idOrCrm, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.deleteDoctor(idOrCrm, actorEmail, actorRole));
  }
  toggleDoctorStatus(id, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.toggleDoctorStatus(id, actorEmail, actorRole));
  }
  setDoctorDiretor(id, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.setDoctorDiretor(id, actorEmail, actorRole));
  }
  getSecretarias(search, ativaOnly) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getSecretarias(search, ativaOnly));
  }
  getSecretariaById(id) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getSecretariaById(id));
  }
  saveSecretaria(sec, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.saveSecretaria(sec, actorEmail, actorRole));
  }
  deleteSecretaria(id, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.deleteSecretaria(id, actorEmail, actorRole));
  }
  getUsers() {
    return this.manager.withTenant(this.tenantId, () => this.manager.getUsers());
  }
  saveUser(user, actorEmail, actorRole) {
    return this.manager.withTenant(this.tenantId, () => this.manager.saveUser(user, actorEmail, actorRole));
  }
  confirmEmail(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.confirmEmail(...args));
  }
  resendConfirmationEmail(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.resendConfirmationEmail(...args));
  }
  changePassword(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.changePassword(...args));
  }
  getMetrics() {
    return this.manager.withTenant(this.tenantId, () => this.manager.getMetrics());
  }
  getAuditLogs(entityType, search) {
    return this.manager.withTenant(this.tenantId, () => this.manager.getAuditLogs(entityType, search));
  }
  importCadastroCSV(...args) {
    return this.manager.withTenant(this.tenantId, () => this.manager.importCadastroCSV(...args));
  }
};
var DatabaseManager = class {
  constructor() {
    this.activeTenantId = "ipme_eusebio";
    this.tenantCaches = /* @__PURE__ */ new Map();
    this.tenants = [];
    this.initTenants();
  }
  resolveTenant(tenantId) {
    if (!tenantId || typeof tenantId !== "string") return "ipme_eusebio";
    const clean = tenantId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return clean || "ipme_eusebio";
  }
  initTenants() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(TENANTS_DIR)) {
        fs.mkdirSync(TENANTS_DIR, { recursive: true });
      }
      if (fs.existsSync(REGISTRY_FILE)) {
        try {
          const raw = fs.readFileSync(REGISTRY_FILE, "utf-8");
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.tenants = parsed;
          } else {
            this.tenants = [...DEFAULT_TENANTS];
            this.saveRegistry();
          }
        } catch {
          this.tenants = [...DEFAULT_TENANTS];
          this.saveRegistry();
        }
      } else {
        this.tenants = [...DEFAULT_TENANTS];
        this.saveRegistry();
      }
      if (!this.tenants.some((t) => t.id === "ipme_eusebio")) {
        this.tenants.unshift(DEFAULT_TENANTS[0]);
        this.saveRegistry();
      }
      if (!this.tenants.some((t) => t.id === "studio_sandbox")) {
        this.tenants.push(DEFAULT_TENANTS[1]);
        this.saveRegistry();
      }
      const prodFile = path.join(TENANTS_DIR, "ipme_eusebio.json");
      if (!fs.existsSync(prodFile)) {
        if (fs.existsSync(DB_FILE)) {
          try {
            fs.copyFileSync(DB_FILE, prodFile);
          } catch (e) {
            console.error("Erro ao migrar base legado para ipme_eusebio:", e);
          }
        }
      }
      const sandboxFile = path.join(TENANTS_DIR, "studio_sandbox.json");
      if (!fs.existsSync(sandboxFile)) {
        const sandboxSeed = {
          employees: DEFAULT_EMPLOYEES,
          occurrences: DEFAULT_OCCURRENCES,
          audit_logs: DEFAULT_AUDIT_LOGS,
          users: DEFAULT_USERS,
          secretarias: DEFAULT_SECRETARIAS,
          doctors: DEFAULT_DOCTORS
        };
        fs.writeFileSync(sandboxFile, JSON.stringify(sandboxSeed, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Erro ao inicializar diret\xF3rio de tenants:", e);
    }
  }
  saveRegistry() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(this.tenants, null, 2), "utf-8");
    } catch (e) {
      console.error("Erro ao salvar registro de tenants:", e);
    }
  }
  getTenants() {
    return this.tenants;
  }
  getTenantById(id) {
    const tid = this.resolveTenant(id);
    return this.tenants.find((t) => t.id === tid);
  }
  saveTenant(tenantData) {
    const rawId = tenantData.id || tenantData.sigla.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const id = this.resolveTenant(rawId);
    const existingIndex = this.tenants.findIndex((t) => t.id === id);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (existingIndex >= 0) {
      const updated = {
        ...this.tenants[existingIndex],
        ...tenantData,
        id
      };
      this.tenants[existingIndex] = updated;
      this.saveRegistry();
      return updated;
    } else {
      const created = {
        id,
        nome: tenantData.nome.trim(),
        sigla: tenantData.sigla.trim(),
        cnpj: tenantData.cnpj?.trim() || "00.000.000/0001-00",
        cidade: tenantData.cidade?.trim() || "Munic\xEDpio Conveniado",
        uf: tenantData.uf?.trim() || "CE",
        ambiente: tenantData.ambiente || "producao",
        ativo: tenantData.ativo !== void 0 ? tenantData.ativo : true,
        created_at: now,
        descricao: tenantData.descricao || `Parti\xE7\xE3o de banco de dados isolada para ${tenantData.nome}.`
      };
      this.tenants.push(created);
      this.saveRegistry();
      const tenantFile = path.join(TENANTS_DIR, `${id}.json`);
      if (!fs.existsSync(tenantFile)) {
        const seed = {
          employees: [],
          occurrences: [],
          audit_logs: [
            {
              id: `audit_init_${Date.now()}`,
              entity_type: "user",
              entity_id: id,
              action: "CREATE",
              details: `Parti\xE7\xE3o de dados isolada criada para o cliente ${created.nome} (${created.sigla}).`,
              changed_by: "Sistema Multi-Tenant",
              user_role: "admin",
              timestamp: now
            }
          ],
          users: DEFAULT_USERS,
          secretarias: DEFAULT_SECRETARIAS,
          doctors: DEFAULT_DOCTORS
        };
        fs.writeFileSync(tenantFile, JSON.stringify(seed, null, 2), "utf-8");
      }
      return created;
    }
  }
  resetSandbox(actorEmail) {
    const sandboxFile = path.join(TENANTS_DIR, "studio_sandbox.json");
    const sandboxSeed = {
      employees: DEFAULT_EMPLOYEES,
      occurrences: DEFAULT_OCCURRENCES,
      audit_logs: [
        {
          id: `audit_reset_${Date.now()}`,
          entity_type: "user",
          entity_id: "studio_sandbox",
          action: "DELETE",
          details: `Ambiente de Homologa\xE7\xE3o / Testes Studio reinicializado com dados simulados por ${actorEmail}. Produ\xE7\xE3o oficial intacta.`,
          changed_by: actorEmail,
          user_role: "admin",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      users: DEFAULT_USERS,
      secretarias: DEFAULT_SECRETARIAS,
      doctors: DEFAULT_DOCTORS
    };
    this.tenantCaches.set("studio_sandbox", sandboxSeed);
    fs.writeFileSync(sandboxFile, JSON.stringify(sandboxSeed, null, 2), "utf-8");
  }
  withTenant(tenantId, fn) {
    const prevTenant = this.activeTenantId;
    try {
      this.activeTenantId = this.resolveTenant(tenantId);
      return fn();
    } finally {
      this.activeTenantId = prevTenant;
    }
  }
  forTenant(tenantId = "ipme_eusebio") {
    return new TenantDatabaseScope(this, this.resolveTenant(tenantId));
  }
  get data() {
    return this.getData(this.activeTenantId);
  }
  getData(tenantId) {
    const tid = this.resolveTenant(tenantId || this.activeTenantId);
    if (!this.tenantCaches.has(tid)) {
      this.tenantCaches.set(tid, this.load(tid));
    }
    return this.tenantCaches.get(tid);
  }
  load(tenantId = "ipme_eusebio") {
    const tid = this.resolveTenant(tenantId);
    const tenantFile = path.join(TENANTS_DIR, `${tid}.json`);
    try {
      if (!fs.existsSync(TENANTS_DIR)) {
        fs.mkdirSync(TENANTS_DIR, { recursive: true });
      }
      let fileToRead = tenantFile;
      if (!fs.existsSync(fileToRead) && tid === "ipme_eusebio" && fs.existsSync(DB_FILE)) {
        fileToRead = DB_FILE;
      }
      if (fs.existsSync(fileToRead)) {
        const raw = fs.readFileSync(fileToRead, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.employees) && Array.isArray(parsed.occurrences)) {
          let needsSave = false;
          if (parsed.secretarias && Array.isArray(parsed.secretarias)) {
            const initialCount = parsed.secretarias.length;
            parsed.secretarias = parsed.secretarias.filter(
              (s) => !/SEC-\d{3}\.\d{3}\.\d{3}-\d{2}/.test(s.id) && !/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(s.sigla) && !/^\d{3}$/.test(s.nome)
            );
            if (parsed.secretarias.length !== initialCount) {
              needsSave = true;
            }
          }
          if (!parsed.secretarias || !Array.isArray(parsed.secretarias) || parsed.secretarias.length === 0) {
            parsed.secretarias = DEFAULT_SECRETARIAS;
            needsSave = true;
          }
          if (!parsed.doctors || !Array.isArray(parsed.doctors) || parsed.doctors.length === 0) {
            parsed.doctors = DEFAULT_DOCTORS;
            needsSave = true;
          }
          if (parsed.doctors && Array.isArray(parsed.doctors)) {
            let docSeq = 1;
            let hasDiretor = parsed.doctors.some((d) => d.is_diretor === true);
            for (const doc of parsed.doctors) {
              if (doc.id && (doc.id.includes("DOC-") || isNaN(Number(doc.id)))) {
                const match = doc.id.match(/\d+$/);
                doc.id = match ? String(parseInt(match[0], 10)) : String(docSeq);
                needsSave = true;
              }
              const currentDocNum = parseInt(doc.id, 10);
              if (!isNaN(currentDocNum) && currentDocNum >= docSeq) {
                docSeq = currentDocNum + 1;
              }
              if (!doc.vinculo) {
                if (doc.nome?.includes("Juliana")) {
                  doc.vinculo = "Comissionado";
                } else if (doc.nome?.includes("Camila")) {
                  doc.vinculo = "Tempor\xE1rio";
                } else {
                  doc.vinculo = "Efetivo";
                }
                needsSave = true;
              }
              if (doc.is_diretor === void 0) {
                doc.is_diretor = false;
                needsSave = true;
              }
            }
            if (!hasDiretor && parsed.doctors.length > 0) {
              const marcelo = parsed.doctors.find((d) => d.nome?.includes("Marcelo")) || parsed.doctors[0];
              marcelo.is_diretor = true;
              needsSave = true;
            }
          }
          if (parsed.users && Array.isArray(parsed.users)) {
            let hasPresidente = parsed.users.some((u) => u.is_presidente === true);
            for (const u of parsed.users) {
              if (u.email_verified !== true) {
                u.email_verified = true;
                needsSave = true;
              }
              if (u.email.toLowerCase() === "pliniocatunda@gmail.com") {
                if (!u.password) {
                  u.password = "IpmeMaster@2026";
                  needsSave = true;
                }
                if (!u.cargo || u.cargo.includes("Administrador")) {
                  u.cargo = "Diretor-Presidente do IPME";
                  needsSave = true;
                }
                if (!u.funcao_pericial) {
                  u.funcao_pericial = "Diretor-Presidente do Instituto";
                  needsSave = true;
                }
                if (!hasPresidente) {
                  u.is_presidente = true;
                  hasPresidente = true;
                  needsSave = true;
                }
              }
            }
            if (!hasPresidente && parsed.users.length > 0) {
              parsed.users[0].is_presidente = true;
              needsSave = true;
            }
          }
          let seqCounter = 1;
          for (const occ of parsed.occurrences) {
            if (occ.id && (occ.id.includes("LIC-") || occ.id.includes("READ-") || isNaN(Number(occ.id)))) {
              const oldId = occ.id;
              const match = oldId.match(/\d+$/);
              const newId = match ? String(parseInt(match[0], 10)) : String(seqCounter);
              occ.id = newId;
              needsSave = true;
            }
            const currentNum = parseInt(occ.id, 10);
            if (!isNaN(currentNum) && currentNum >= seqCounter) {
              seqCounter = currentNum + 1;
            }
            if (!occ.prorrogacoes) {
              occ.prorrogacoes = [];
              needsSave = true;
            }
            if (!occ.data_termino_inicial) {
              occ.data_termino_inicial = occ.data_termino;
              needsSave = true;
            }
          }
          if (needsSave || !fs.existsSync(tenantFile)) {
            this.saveTenantToDisk(tid, parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error(`Error loading database for tenant ${tid}, initializing fresh seed:`, e);
    }
    const initial = {
      employees: tid === "studio_sandbox" ? DEFAULT_EMPLOYEES : [],
      occurrences: tid === "studio_sandbox" ? DEFAULT_OCCURRENCES : [],
      audit_logs: DEFAULT_AUDIT_LOGS,
      users: DEFAULT_USERS,
      secretarias: DEFAULT_SECRETARIAS,
      doctors: DEFAULT_DOCTORS
    };
    this.saveTenantToDisk(tid, initial);
    return initial;
  }
  saveToDisk(dataToSave) {
    this.saveTenantToDisk(this.activeTenantId, dataToSave);
  }
  saveTenantToDisk(tenantId, dataToSave) {
    const tid = this.resolveTenant(tenantId);
    try {
      if (!fs.existsSync(TENANTS_DIR)) {
        fs.mkdirSync(TENANTS_DIR, { recursive: true });
      }
      this.tenantCaches.set(tid, dataToSave);
      const tenantFile = path.join(TENANTS_DIR, `${tid}.json`);
      const tmp = `${tenantFile}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(dataToSave, null, 2), "utf-8");
      fs.renameSync(tmp, tenantFile);
      if (tid === "ipme_eusebio") {
        try {
          const dbTmp = `${DB_FILE}.tmp`;
          fs.writeFileSync(dbTmp, JSON.stringify(dataToSave, null, 2), "utf-8");
          fs.renameSync(dbTmp, DB_FILE);
        } catch {
        }
      }
    } catch (e) {
      console.error(`Error writing database for tenant ${tid} to disk:`, e);
    }
  }
  getEmployees(search, secretaria, status) {
    let list = [...this.data.employees];
    if (secretaria && secretaria !== "ALL") {
      list = list.filter((e) => e.secretaria.toLowerCase().includes(secretaria.toLowerCase()));
    }
    if (status && status !== "ALL") {
      list = list.filter((e) => e.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const qClean = q.replace(/\D/g, "");
      list = list.filter((e) => {
        const matchMatricula = e.matricula.toLowerCase().includes(q);
        const matchNome = e.nome.toLowerCase().includes(q);
        const matchCpf = qClean && e.cpf.replace(/\D/g, "").includes(qClean);
        const matchCargo = e.cargo.toLowerCase().includes(q);
        return matchMatricula || matchNome || matchCpf || matchCargo;
      });
    }
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }
  getEmployeeByMatricula(matricula) {
    return this.data.employees.find((e) => e.matricula.toUpperCase() === matricula.toUpperCase());
  }
  saveEmployee(employee, actorEmail, actorRole) {
    const existingIndex = this.data.employees.findIndex((e) => e.matricula.toUpperCase() === employee.matricula.toUpperCase());
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (existingIndex >= 0) {
      const existing = this.data.employees[existingIndex];
      const updated = {
        ...existing,
        ...employee,
        matricula: existing.matricula,
        // immutable PK
        updated_at: now
      };
      this.data.employees[existingIndex] = updated;
      this.addAuditLog({
        entity_type: "employee",
        entity_id: updated.matricula,
        action: "UPDATE",
        details: `Dados do servidor ${updated.nome} (Matr\xEDcula: ${updated.matricula}) foram atualizados.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return updated;
    } else {
      const created = {
        matricula: employee.matricula.trim().toUpperCase(),
        nome: employee.nome.trim(),
        cpf: employee.cpf.trim(),
        telefone: employee.telefone || "",
        secretaria: employee.secretaria || "SME - Secretaria Municipal de Educa\xE7\xE3o",
        setor: employee.setor || "Geral",
        cargo: employee.cargo || "Servidor Municipal",
        status: employee.status || "Ativo",
        data_admissao: employee.data_admissao || now.split("T")[0],
        email: employee.email || "",
        created_at: now,
        updated_at: now,
        created_by: actorEmail
      };
      this.data.employees.push(created);
      this.addAuditLog({
        entity_type: "employee",
        entity_id: created.matricula,
        action: "CREATE",
        details: `Novo servidor cadastrado: ${created.nome} (${created.matricula}), Cargo: ${created.cargo}, Secretaria: ${created.secretaria}.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return created;
    }
  }
  deleteEmployee(matricula, actorEmail, actorRole) {
    if (actorRole !== "admin") {
      throw new Error("Apenas Administradores podem excluir cadastros de servidores.");
    }
    const emp = this.getEmployeeByMatricula(matricula);
    if (!emp) return false;
    const activeOccurrences = this.data.occurrences.filter(
      (o) => o.matricula.toUpperCase() === matricula.toUpperCase() && (o.status === "Ativa" || o.status === "Prorrogada")
    );
    if (activeOccurrences.length > 0) {
      throw new Error(`N\xE3o \xE9 poss\xEDvel excluir o servidor ${emp.nome} pois existem afastamentos ativos vinculados a ele.`);
    }
    this.data.employees = this.data.employees.filter((e) => e.matricula.toUpperCase() !== matricula.toUpperCase());
    this.addAuditLog({
      entity_type: "employee",
      entity_id: matricula,
      action: "DELETE",
      details: `Servidor ${emp.nome} (${matricula}) exclu\xEDdo permanentemente pelo administrador.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return true;
  }
  clearAllEmployees(actorEmail, actorRole) {
    const deletedEmployees = this.data.employees.length;
    const deletedOccurrences = this.data.occurrences.length;
    this.data.employees = [];
    this.data.occurrences = [];
    this.addAuditLog({
      entity_type: "employee",
      entity_id: "ALL",
      action: "DELETE",
      details: `Limpeza geral de cadastro: ${deletedEmployees} servidores e ${deletedOccurrences} ocorr\xEAncias foram apagados para in\xEDcio de homologa\xE7\xE3o com dados reais.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return { deletedEmployees, deletedOccurrences };
  }
  getOccurrences(matricula, tipo, status, dataInicio, dataTermino) {
    let list = [...this.data.occurrences];
    if (matricula && matricula !== "ALL") {
      list = list.filter((o) => o.matricula.toUpperCase() === matricula.toUpperCase());
    }
    if (tipo && tipo !== "ALL") {
      list = list.filter((o) => o.tipo === tipo);
    }
    if (status && status !== "ALL") {
      list = list.filter((o) => o.status === status);
    }
    if (dataInicio) {
      list = list.filter((o) => o.data_inicio >= dataInicio);
    }
    if (dataTermino) {
      list = list.filter((o) => o.data_termino <= dataTermino);
    }
    return list.map((o) => {
      const emp = this.getEmployeeByMatricula(o.matricula);
      return {
        ...o,
        employee_nome: emp ? emp.nome : o.employee_nome,
        employee_cargo: emp ? emp.cargo : o.employee_cargo,
        employee_secretaria: emp ? emp.secretaria : o.employee_secretaria
      };
    }).sort((a, b) => b.data_inicio.localeCompare(a.data_inicio));
  }
  getOccurrenceById(id) {
    const occ = this.data.occurrences.find((o) => o.id === id);
    if (!occ) return void 0;
    const emp = this.getEmployeeByMatricula(occ.matricula);
    return {
      ...occ,
      employee_nome: emp ? emp.nome : occ.employee_nome,
      employee_cargo: emp ? emp.cargo : occ.employee_cargo,
      employee_secretaria: emp ? emp.secretaria : occ.employee_secretaria
    };
  }
  saveOccurrence(occurrenceData, actorEmail, actorRole) {
    const employee = this.getEmployeeByMatricula(occurrenceData.matricula);
    if (!employee) {
      throw new Error(`Servidor com matr\xEDcula ${occurrenceData.matricula} n\xE3o encontrado.`);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const days = occurrenceData.quantidade_dias || this.calculateDays(occurrenceData.data_inicio, occurrenceData.data_termino);
    if (occurrenceData.id) {
      const index = this.data.occurrences.findIndex((o) => o.id === occurrenceData.id);
      if (index === -1) throw new Error("Ocorr\xEAncia n\xE3o encontrada.");
      const existing = this.data.occurrences[index];
      if (occurrenceData.tipo === "Licen\xE7a Definitiva" && occurrenceData.data_concessao && occurrenceData.data_termino) {
        if (occurrenceData.data_concessao <= occurrenceData.data_termino) {
          throw new Error(`A licen\xE7a permanente n\xE3o poder\xE1 ser concedida dentro do prazo vigente de licen\xE7a (t\xE9rmino em ${occurrenceData.data_termino}). A Data da Concess\xE3o deve ser posterior a essa data.`);
        }
      }
      const updated = {
        ...existing,
        ...occurrenceData,
        quantidade_dias: days,
        employee_nome: employee.nome,
        employee_cargo: employee.cargo,
        employee_secretaria: employee.secretaria,
        updated_at: now
      };
      this.data.occurrences[index] = updated;
      this.syncEmployeeStatus(employee.matricula);
      this.addAuditLog({
        entity_type: "occurrence",
        entity_id: updated.id,
        action: "UPDATE",
        details: `Atualiza\xE7\xE3o da ocorr\xEAncia ${updated.id} (${updated.tipo}) vinculada ao servidor ${employee.nome}. Status: ${updated.status}.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return updated;
    } else {
      if (occurrenceData.tipo === "Licen\xE7a Definitiva") {
        throw new Error("A Licen\xE7a Definitiva n\xE3o pode ser cadastrada diretamente como uma nova ocorr\xEAncia. Ela deve ser originada a partir da transforma\xE7\xE3o de uma licen\xE7a j\xE1 ativa ou prorrogada com a devida Data da Concess\xE3o.");
      }
      const existingActiveOcc = this.data.occurrences.find(
        (o) => o.matricula.toUpperCase() === employee.matricula.toUpperCase() && (o.status === "Ativa" || o.status === "Prorrogada")
      );
      if (existingActiveOcc) {
        const isAtrasado = existingActiveOcc.data_termino < (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const atrasoMsg = isAtrasado ? " (atualmente com previs\xE3o de retorno em atraso)" : "";
        throw new Error(
          `Bloqueio de Integridade: O servidor ${employee.nome} (${employee.matricula}) j\xE1 possui um afastamento ativo em andamento (Ocorr\xEAncia N\xBA ${existingActiveOcc.id} - ${existingActiveOcc.tipo}${atrasoMsg}, t\xE9rmino previsto: ${existingActiveOcc.data_termino}). Para garantir a integridade cadastral e evitar sobreposi\xE7\xE3o de licen\xE7as, conclua a per\xEDcia de retorno, homologue a prorroga\xE7\xE3o ou cancele o afastamento existente antes de registrar uma nova licen\xE7a.`
        );
      }
      let maxId = 0;
      for (const o of this.data.occurrences) {
        const num = parseInt(o.id.replace(/\D/g, ""), 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
      const nextId = String(maxId + 1);
      const created = {
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
        cid: occurrenceData.cid || "",
        medico_perito: occurrenceData.medico_perito || "Junta M\xE9dica Oficial IPME",
        crm: occurrenceData.crm || "CRM/CE",
        status: occurrenceData.status || "Ativa",
        anexo_url: occurrenceData.anexo_url || "",
        anexo_nome: occurrenceData.anexo_nome || "",
        observacoes: occurrenceData.observacoes || "",
        parecer_tecnico: occurrenceData.parecer_tecnico || "",
        prorrogacoes: [],
        created_at: now,
        updated_at: now,
        created_by: actorEmail
      };
      this.data.occurrences.push(created);
      this.syncEmployeeStatus(employee.matricula);
      this.addAuditLog({
        entity_type: "occurrence",
        entity_id: created.id,
        action: "CREATE",
        details: `Novo registro de ${created.tipo} aberto para ${employee.nome} (${employee.matricula}). Per\xEDodo: ${created.data_inicio} at\xE9 ${created.data_termino} (${created.quantidade_dias} dias).`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return created;
    }
  }
  prorrogarOccurrence(id, novaDataTermino, motivo, medico, crm, actorEmail, actorRole) {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error("Ocorr\xEAncia n\xE3o encontrada.");
    const oldTermino = occ.data_termino;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newDays = this.calculateDays(occ.data_inicio, novaDataTermino);
    if (!occ.prorrogacoes) {
      occ.prorrogacoes = [];
    }
    if (!occ.data_termino_inicial) {
      occ.data_termino_inicial = oldTermino;
    }
    const addedDays = Math.max(1, Math.round(((/* @__PURE__ */ new Date(novaDataTermino + "T12:00:00")).getTime() - (/* @__PURE__ */ new Date(oldTermino + "T12:00:00")).getTime()) / (1e3 * 60 * 60 * 24)));
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
      motivo: motivo || "Necessidade de continuidade do tratamento m\xE9dico prescrito.",
      medico_perito: medico || occ.medico_perito,
      crm: crm || occ.crm,
      created_at: now,
      created_by: actorEmail
    };
    occ.prorrogacoes.push(extensionRecord);
    occ.status = "Prorrogada";
    occ.data_termino = novaDataTermino;
    occ.quantidade_dias = newDays;
    occ.updated_at = now;
    if (medico) occ.medico_perito = medico;
    if (crm) occ.crm = crm;
    const dataHoraBR = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const notaProrrogacao = `
[${sequencial}\xAA Prorroga\xE7\xE3o em ${dataHoraBR} por ${actorEmail}]: Data de t\xE9rmino estendida de ${oldTermino} para ${novaDataTermino} (+${addedDays} dias, total ${newDays}d). Perito: ${extensionRecord.medico_perito} (${extensionRecord.crm}). Motivo: ${motivo}`;
    occ.parecer_tecnico = (occ.parecer_tecnico || "") + notaProrrogacao;
    const index = this.data.occurrences.findIndex((o) => o.id === id);
    this.data.occurrences[index] = occ;
    this.syncEmployeeStatus(occ.matricula);
    this.addAuditLog({
      entity_type: "occurrence",
      entity_id: occ.id,
      action: "PRORROGAR",
      details: `${sequencial}\xAA Prorroga\xE7\xE3o da ${occ.tipo} N\xBA ${occ.id} concedida at\xE9 ${novaDataTermino} (+${addedDays} dias, total ${newDays}d, ${diasPagosAcumulados}d pagos). Perito: ${extensionRecord.medico_perito}. Motivo: ${motivo}.`,
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
  concluirOccurrence(id, parecerFinal, actorEmail, actorRole, dataConcessao, atoConcessao) {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error("Ocorr\xEAncia n\xE3o encontrada.");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const dataHoraBR = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const isDefinitiva = occ.tipo === "Licen\xE7a Definitiva";
    if (isDefinitiva) {
      if (!dataConcessao || !dataConcessao.trim()) {
        throw new Error("A Data de Concess\xE3o \xE9 obrigat\xF3ria para a conclus\xE3o e arquivamento da Licen\xE7a Definitiva.");
      }
      occ.data_concessao = dataConcessao.trim();
      if (atoConcessao && atoConcessao.trim()) {
        occ.ato_concessao = atoConcessao.trim();
      }
      occ.status = "Arquivado";
      occ.updated_at = now;
      occ.parecer_tecnico = (occ.parecer_tecnico || "") + `
[Conclus\xE3o / Arquivamento em ${dataHoraBR} por ${actorEmail}]: Homologada a aposentadoria definitiva do servidor. Data de Concess\xE3o: ${occ.data_concessao}. Ato: ${occ.ato_concessao || "N/A"}. Parecer: ${parecerFinal || "Afastamento definitivo homologado em per\xEDcia oficial."}`;
      const index = this.data.occurrences.findIndex((o) => o.id === id);
      this.data.occurrences[index] = occ;
      this.syncEmployeeStatus(occ.matricula);
      this.addAuditLog({
        entity_type: "occurrence",
        entity_id: occ.id,
        action: "ARQUIVAR",
        details: `Conclus\xE3o e arquivamento definitivo da Licen\xE7a Definitiva N\xBA ${occ.id} (Aposentadoria homologada). Data de Concess\xE3o: ${occ.data_concessao}. Ato: ${occ.ato_concessao || "N/A"}. Parecer: ${parecerFinal}.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
    } else {
      occ.status = "Conclu\xEDda";
      occ.updated_at = now;
      occ.parecer_tecnico = (occ.parecer_tecnico || "") + `
[Conclus\xE3o em ${dataHoraBR}]: ${parecerFinal || "Per\xEDcia de retorno realizada. Servidor apto."}`;
      const index = this.data.occurrences.findIndex((o) => o.id === id);
      this.data.occurrences[index] = occ;
      this.syncEmployeeStatus(occ.matricula);
      this.addAuditLog({
        entity_type: "occurrence",
        entity_id: occ.id,
        action: "CONCLUIR",
        details: `Conclus\xE3o e encerramento pericial da ${occ.tipo} ${occ.id}. Parecer: ${parecerFinal}.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
    }
    this.saveToDisk(this.data);
    return occ;
  }
  retornarTrabalhoOccurrence(id, dataRetorno, motivoRetorno, medico, crm, atoReversao, actorEmail, actorRole) {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error("Ocorr\xEAncia n\xE3o encontrada.");
    if (occ.tipo !== "Licen\xE7a Definitiva") {
      throw new Error("A a\xE7\xE3o de Retorno ao Trabalho por revers\xE3o pericial aplica-se \xE0 Licen\xE7a Definitiva.");
    }
    if (!dataRetorno || !dataRetorno.trim()) {
      throw new Error("A Data do Retorno ao Trabalho \xE9 obrigat\xF3ria.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const dataHoraBR = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    occ.status = "Conclu\xEDda";
    occ.data_retorno = dataRetorno.trim();
    occ.motivo_retorno = motivoRetorno?.trim() || "Revers\xE3o pericial homologada pela Junta M\xE9dica Oficial.";
    occ.updated_at = now;
    if (medico) occ.medico_perito = medico;
    if (crm) occ.crm = crm;
    occ.parecer_tecnico = (occ.parecer_tecnico || "") + `
[Revers\xE3o / Retorno ao Trabalho em ${dataHoraBR} por ${actorEmail}]: Revers\xE3o homologada com retorno \xE0s atividades funcionais em ${occ.data_retorno}. Ato: ${atoReversao || "N/A"}. Perito: ${occ.medico_perito} (${occ.crm}). Parecer: ${occ.motivo_retorno}`;
    const index = this.data.occurrences.findIndex((o) => o.id === id);
    this.data.occurrences[index] = occ;
    this.syncEmployeeStatus(occ.matricula);
    this.addAuditLog({
      entity_type: "occurrence",
      entity_id: occ.id,
      action: "RETORNO_TRABALHO",
      details: `Revers\xE3o pericial e retorno ao trabalho da Licen\xE7a Definitiva N\xBA ${occ.id} (Servidor: ${occ.employee_nome}). Data de Retorno: ${occ.data_retorno}. Perito: ${occ.medico_perito} (${occ.crm}).`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return occ;
  }
  converterOccurrenceDefinitiva(id, dataConcessao, atoConcessao, motivo, medico, crm, parecerTecnico, actorEmail, actorRole) {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error("Ocorr\xEAncia n\xE3o encontrada.");
    if (occ.status !== "Ativa" && occ.status !== "Prorrogada") {
      throw new Error(`Apenas licen\xE7as com status Ativa ou Prorrogada podem ser convertidas em definitiva. Status atual: ${occ.status}.`);
    }
    if (!dataConcessao || !dataConcessao.trim()) {
      throw new Error("A Data da Concess\xE3o \xE9 obrigat\xF3ria para tornar a licen\xE7a definitiva.");
    }
    if (occ.data_termino && dataConcessao.trim() <= occ.data_termino) {
      throw new Error(`A licen\xE7a permanente n\xE3o poder\xE1 ser concedida dentro do prazo vigente de licen\xE7a (vigente at\xE9 ${occ.data_termino}). A Data da Concess\xE3o deve ser posterior ao t\xE9rmino da licen\xE7a atual.`);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const oldTipo = occ.tipo;
    occ.tipo = "Licen\xE7a Definitiva";
    occ.status = "Ativa";
    occ.data_concessao = dataConcessao.trim();
    occ.ato_concessao = atoConcessao?.trim() || "";
    occ.motivo_definitiva = motivo?.trim() || "Incapacidade laborativa definitiva homologada em junta pericial.";
    occ.data_conversao = now;
    occ.updated_at = now;
    if (medico) occ.medico_perito = medico;
    if (crm) occ.crm = crm;
    const dataHoraBR = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    const notaConversao = `
[Convers\xE3o em Licen\xE7a Definitiva em ${dataHoraBR} por ${actorEmail}]: Licen\xE7a transformada de "${oldTipo}" para "Licen\xE7a Definitiva". Data da Concess\xE3o: ${dataConcessao}${occ.ato_concessao ? ` | Ato Concess\xF3rio: ${occ.ato_concessao}` : ""}. M\xE9dico Respons\xE1vel: ${occ.medico_perito} (${occ.crm}). Justificativa: ${occ.motivo_definitiva}${parecerTecnico ? ` | Parecer Conclusivo: ${parecerTecnico}` : ""}`;
    occ.parecer_tecnico = (occ.parecer_tecnico || "") + notaConversao;
    const index = this.data.occurrences.findIndex((o) => o.id === id);
    this.data.occurrences[index] = occ;
    this.syncEmployeeStatus(occ.matricula);
    this.addAuditLog({
      entity_type: "occurrence",
      entity_id: occ.id,
      action: "CONVERTER_DEFINITIVA",
      details: `Ocorr\xEAncia N\xBA ${occ.id} do servidor ${occ.employee_nome} convertida em Licen\xE7a Definitiva. Data de Concess\xE3o: ${dataConcessao}.${occ.ato_concessao ? ` Ato: ${occ.ato_concessao}.` : ""}`,
      changed_by: actorEmail,
      user_role: actorRole,
      diff: {
        before: { tipo: oldTipo },
        after: { tipo: "Licen\xE7a Definitiva", data_concessao: dataConcessao, ato_concessao: occ.ato_concessao }
      }
    });
    this.saveToDisk(this.data);
    return occ;
  }
  cancelarOccurrence(id, motivo, actorEmail, actorRole) {
    const occ = this.getOccurrenceById(id);
    if (!occ) throw new Error("Ocorr\xEAncia n\xE3o encontrada.");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    occ.status = "Cancelada";
    occ.updated_at = now;
    const dataHoraBR = (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR");
    occ.observacoes = (occ.observacoes || "") + `
[Cancelamento em ${dataHoraBR} por ${actorEmail}]: ${motivo}`;
    const index = this.data.occurrences.findIndex((o) => o.id === id);
    this.data.occurrences[index] = occ;
    this.syncEmployeeStatus(occ.matricula);
    this.addAuditLog({
      entity_type: "occurrence",
      entity_id: occ.id,
      action: "CANCELAR",
      details: `Cancelamento da ocorr\xEAncia ${occ.id}. Justificativa: ${motivo}.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return occ;
  }
  deleteOccurrence(id, actorEmail, actorRole) {
    if (actorRole !== "admin") {
      throw new Error("Apenas Administradores podem excluir registros de afastamentos permanentemente.");
    }
    const occ = this.getOccurrenceById(id);
    if (!occ) return false;
    this.data.occurrences = this.data.occurrences.filter((o) => o.id !== id);
    this.syncEmployeeStatus(occ.matricula);
    this.addAuditLog({
      entity_type: "occurrence",
      entity_id: id,
      action: "DELETE",
      details: `Registro de ${occ.tipo} ${id} (Servidor: ${occ.employee_nome}) exclu\xEDdo definitivamente do sistema.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return true;
  }
  clearOccurrences(actorEmail, actorRole) {
    const count = this.data.occurrences.length;
    this.data.occurrences = [];
    for (const emp of this.data.employees) {
      emp.status = "Ativo";
      emp.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.addAuditLog({
      entity_type: "occurrence",
      entity_id: "ALL",
      action: "DELETE",
      details: `Limpeza geral de ocorr\xEAncias: ${count} afastamentos removidos para novos testes. Servidores mantidos com status Ativo.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return count;
  }
  syncEmployeeStatus(matricula) {
    const empIndex = this.data.employees.findIndex((e) => e.matricula.toUpperCase() === matricula.toUpperCase());
    if (empIndex === -1) return;
    const activeOccurrences = this.data.occurrences.filter(
      (o) => o.matricula.toUpperCase() === matricula.toUpperCase() && (o.status === "Ativa" || o.status === "Prorrogada")
    );
    const hasArchivedDefinitiva = this.data.occurrences.some(
      (o) => o.matricula.toUpperCase() === matricula.toUpperCase() && o.tipo === "Licen\xE7a Definitiva" && o.status === "Arquivado"
    );
    let nextStatus = "Ativo";
    if (activeOccurrences.length > 0) {
      const hasLicenca = activeOccurrences.some((o) => o.tipo !== "Readapta\xE7\xE3o");
      nextStatus = hasLicenca ? "Licenciado" : "Readaptado";
    } else if (hasArchivedDefinitiva) {
      nextStatus = "Aposentado";
    }
    if (this.data.employees[empIndex].status !== nextStatus) {
      const prev = this.data.employees[empIndex].status;
      this.data.employees[empIndex].status = nextStatus;
      this.data.employees[empIndex].updated_at = (/* @__PURE__ */ new Date()).toISOString();
      this.addAuditLog({
        entity_type: "employee",
        entity_id: matricula,
        action: "UPDATE",
        details: `Status funcional sincronizado automaticamente: de "${prev}" para "${nextStatus}".`,
        changed_by: "Sistema IPME (Automa\xE7\xE3o)",
        user_role: "admin"
      });
    }
  }
  getAuditLogs(entityType, search) {
    let list = [...this.data.audit_logs];
    if (entityType && entityType !== "ALL") {
      list = list.filter((l) => l.entity_type === entityType);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => l.details.toLowerCase().includes(q) || l.entity_id.toLowerCase().includes(q) || l.changed_by.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
  getUsers() {
    return this.data.users;
  }
  saveUser(userData, actorEmail, actorRole) {
    if (actorRole !== "admin") {
      throw new Error("Apenas o Administrador Master pode cadastrar ou alterar operadores.");
    }
    const emailNorm = (userData.email || "").trim().toLowerCase();
    if (!emailNorm) throw new Error("E-mail \xE9 obrigat\xF3rio.");
    const isMaster = emailNorm === "pliniocatunda@gmail.com";
    const existingIndex = this.data.users.findIndex((u) => u.email.toLowerCase() === emailNorm);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (userData.is_presidente === true) {
      this.data.users.forEach((u) => {
        if (u.email.toLowerCase() !== emailNorm) {
          u.is_presidente = false;
        }
      });
    }
    if (existingIndex >= 0) {
      const existing = this.data.users[existingIndex];
      const updated = {
        ...existing,
        ...userData,
        email: existing.email,
        role: isMaster ? "admin" : userData.role || "operator",
        auth_provider: isMaster ? "google" : "corporate",
        cargo: userData.cargo !== void 0 ? userData.cargo.trim() : existing.cargo,
        funcao_pericial: userData.funcao_pericial !== void 0 ? userData.funcao_pericial.trim() : existing.funcao_pericial,
        is_presidente: userData.is_presidente !== void 0 ? !!userData.is_presidente : existing.is_presidente ?? (isMaster ? true : false),
        ativo: isMaster ? true : userData.ativo !== void 0 ? userData.ativo : existing.ativo ?? true,
        password: userData.password ? userData.password.trim() : existing.password || "Ipme@2026",
        email_verified: isMaster ? true : userData.email_verified !== void 0 ? userData.email_verified : existing.email_verified ?? true,
        must_change_password: isMaster ? false : userData.must_change_password !== void 0 ? userData.must_change_password : existing.must_change_password ?? false
      };
      this.data.users[existingIndex] = updated;
      this.addAuditLog({
        entity_type: "user",
        entity_id: updated.email,
        action: "UPDATE",
        details: `Operador ${updated.name} (${updated.email}) atualizado. Cargo: ${updated.cargo || "N/A"}. Fun\xE7\xE3o: ${updated.funcao_pericial || "N/A"}. Presidente: ${updated.is_presidente ? "Sim" : "N\xE3o"}. Lota\xE7\xE3o: ${updated.department}. Status: ${updated.ativo !== false ? "Ativo" : "Inativo"}.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return updated;
    } else {
      const initialPassword = userData.password && userData.password.trim() ? userData.password.trim() : `Ipme@${Math.floor(1e3 + Math.random() * 9e3)}`;
      const confirmationCode = Math.floor(1e5 + Math.random() * 9e5).toString();
      const confirmationToken = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const created = {
        id: userData.id || `user_${Date.now()}`,
        email: emailNorm,
        name: userData.name || emailNorm.split("@")[0],
        role: isMaster ? "admin" : userData.role || "operator",
        auth_provider: isMaster ? "google" : "corporate",
        department: userData.department || "IPME - Junta M\xE9dica",
        cargo: userData.cargo ? userData.cargo.trim() : isMaster ? "Diretor-Presidente do IPME" : "Operador Pericial",
        funcao_pericial: userData.funcao_pericial ? userData.funcao_pericial.trim() : isMaster ? "Diretor-Presidente do Instituto" : "Operador da Junta M\xE9dica Pericial",
        is_presidente: userData.is_presidente !== void 0 ? !!userData.is_presidente : isMaster ? true : false,
        telefone: userData.telefone || "",
        ativo: userData.ativo !== void 0 ? userData.ativo : true,
        avatar_url: userData.avatar_url || (isMaster ? "/logo-ipme.png" : ""),
        password: initialPassword,
        email_verified: true,
        must_change_password: isMaster ? false : userData.must_change_password !== void 0 ? userData.must_change_password : false,
        created_at: now
      };
      this.data.users.push(created);
      this.addAuditLog({
        entity_type: "user",
        entity_id: created.email,
        action: "CREATE",
        details: `Novo operador cadastrado pelo Administrador: ${created.name} (${created.email}), Cargo: ${created.cargo}. Fun\xE7\xE3o: ${created.funcao_pericial}. Presidente: ${created.is_presidente ? "Sim" : "N\xE3o"}. Lota\xE7\xE3o: ${created.department}. Senha inicial definida. Acesso liberado.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return created;
    }
  }
  confirmEmail(email, codeOrToken, actorEmail = "Sistema IPME") {
    const emailNorm = (email || "").trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (!user) {
      throw new Error(`Operador com o e-mail "${email}" n\xE3o encontrado.`);
    }
    const trimmedInput = (codeOrToken || "").trim();
    const matchesCode = user.confirmation_code && user.confirmation_code === trimmedInput;
    const matchesToken = user.confirmation_token && user.confirmation_token === trimmedInput;
    if (!matchesCode && !matchesToken) {
      throw new Error("C\xF3digo ou link de confirma\xE7\xE3o inv\xE1lido ou expirado. Verifique o c\xF3digo de 6 d\xEDgitos enviado para seu e-mail.");
    }
    user.email_verified = true;
    user.confirmation_code = void 0;
    user.confirmation_token = void 0;
    this.addAuditLog({
      entity_type: "user",
      entity_id: user.email,
      action: "UPDATE",
      details: `Cadastro do operador ${user.name} (${user.email}) confirmado e ativado com sucesso via valida\xE7\xE3o de e-mail institucional.`,
      changed_by: actorEmail,
      user_role: "operator"
    });
    this.saveToDisk(this.data);
    return user;
  }
  resendConfirmationEmail(email, actorEmail = "Sistema IPME") {
    const emailNorm = (email || "").trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (!user) {
      throw new Error(`Operador com o e-mail "${email}" n\xE3o encontrado.`);
    }
    const confirmationCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const confirmationToken = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    user.confirmation_code = confirmationCode;
    user.confirmation_token = confirmationToken;
    user.confirmation_sent_at = now;
    user.email_verified = false;
    this.addAuditLog({
      entity_type: "user",
      entity_id: user.email,
      action: "UPDATE",
      details: `Novo e-mail institucional de confirma\xE7\xE3o de cadastro despachado para ${user.name} (${user.email}) com c\xF3digo ${confirmationCode}.`,
      changed_by: actorEmail,
      user_role: "admin"
    });
    this.saveToDisk(this.data);
    return {
      success: true,
      code: confirmationCode,
      token: confirmationToken,
      email: user.email,
      name: user.name
    };
  }
  changePassword(email, currentPass, newPass, actorEmail) {
    const emailNorm = (email || "").trim().toLowerCase();
    const user = this.data.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (!user) {
      throw new Error(`Usu\xE1rio "${email}" n\xE3o encontrado no sistema.`);
    }
    if (!newPass || newPass.trim().length < 6) {
      throw new Error("A nova senha deve possuir no m\xEDnimo 6 caracteres.");
    }
    const currentTrim = (currentPass || "").trim();
    const newTrim = newPass.trim();
    if (user.password && user.password !== currentTrim) {
      throw new Error("A senha atual informada est\xE1 incorreta. Verifique e tente novamente.");
    }
    if (user.password && user.password === newTrim) {
      throw new Error("A nova senha n\xE3o pode ser id\xEAntica \xE0 senha atual.");
    }
    user.password = newTrim;
    user.must_change_password = false;
    this.addAuditLog({
      entity_type: "user",
      entity_id: user.email,
      action: "UPDATE",
      details: `Senha de acesso alterada pelo pr\xF3prio usu\xE1rio (${user.name} - ${user.email}).`,
      changed_by: actorEmail || user.email,
      user_role: user.role
    });
    this.saveToDisk(this.data);
    return user;
  }
  deleteUser(email, actorEmail, actorRole) {
    if (email.toLowerCase() === "pliniocatunda@gmail.com") {
      throw new Error("A conta do Administrador Master (pliniocatunda@gmail.com) \xE9 permanente e n\xE3o pode ser exclu\xEDda.");
    }
    if (actorRole !== "admin") {
      throw new Error("Apenas o Administrador Master pode excluir operadores.");
    }
    const index = this.data.users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (index === -1) throw new Error("Operador n\xE3o encontrado.");
    const user = this.data.users[index];
    this.data.users.splice(index, 1);
    this.addAuditLog({
      entity_type: "user",
      entity_id: email,
      action: "DELETE",
      details: `Operador ${user.name} (${user.email}) exclu\xEDdo pelo Administrador Master.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return true;
  }
  getSecretarias(search, apenasAtivas) {
    let list = [...this.data.secretarias || []];
    if (apenasAtivas) {
      list = list.filter((s) => s.ativa);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) => s.sigla.toLowerCase().includes(q) || s.nome.toLowerCase().includes(q) || s.secretario && s.secretario.toLowerCase().includes(q)
      );
    }
    return list.map((s) => {
      const servidoresCount = this.data.employees.filter(
        (e) => e.secretaria.toLowerCase().includes(s.sigla.toLowerCase()) || e.secretaria.toLowerCase().includes(s.nome.toLowerCase())
      ).length;
      return {
        ...s,
        servidores_count: servidoresCount
      };
    }).sort((a, b) => a.sigla.localeCompare(b.sigla));
  }
  getSecretariaById(id) {
    const sec = this.data.secretarias?.find((s) => s.id === id || s.sigla.toUpperCase() === id.toUpperCase());
    if (!sec) return void 0;
    const servidoresCount = this.data.employees.filter(
      (e) => e.secretaria.toLowerCase().includes(sec.sigla.toLowerCase()) || e.secretaria.toLowerCase().includes(sec.nome.toLowerCase())
    ).length;
    return { ...sec, servidores_count: servidoresCount };
  }
  saveSecretaria(secretariaData, actorEmail, actorRole) {
    if (!this.data.secretarias) {
      this.data.secretarias = [...DEFAULT_SECRETARIAS];
    }
    const cleanSigla = secretariaData.sigla.trim().toUpperCase();
    const cleanNome = secretariaData.nome.trim();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const existingIndex = this.data.secretarias.findIndex(
      (s) => s.id === secretariaData.id || s.sigla.toUpperCase() === cleanSigla
    );
    if (existingIndex >= 0) {
      const existing = this.data.secretarias[existingIndex];
      const updated = {
        ...existing,
        ...secretariaData,
        sigla: cleanSigla,
        nome: cleanNome,
        ativa: secretariaData.ativa !== void 0 ? secretariaData.ativa : existing.ativa,
        updated_at: now
      };
      this.data.secretarias[existingIndex] = updated;
      this.addAuditLog({
        entity_type: "user",
        entity_id: updated.sigla,
        action: "UPDATE",
        details: `Secretaria ${updated.sigla} - ${updated.nome} atualizada pelo usu\xE1rio.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return updated;
    } else {
      const id = `SEC-${cleanSigla}`;
      const created = {
        id,
        sigla: cleanSigla,
        nome: cleanNome,
        secretario: secretariaData.secretario?.trim() || "",
        email: secretariaData.email?.trim() || "",
        telefone: secretariaData.telefone?.trim() || "",
        endereco: secretariaData.endereco?.trim() || "",
        ativa: secretariaData.ativa !== void 0 ? secretariaData.ativa : true,
        created_at: now,
        updated_at: now,
        created_by: actorEmail
      };
      this.data.secretarias.push(created);
      this.addAuditLog({
        entity_type: "user",
        entity_id: created.sigla,
        action: "CREATE",
        details: `Nova Secretaria cadastrada no IPME: ${created.sigla} - ${created.nome}.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return created;
    }
  }
  deleteSecretaria(id, actorEmail, actorRole) {
    if (actorRole !== "admin") {
      throw new Error("Apenas Administradores podem excluir secretarias do sistema.");
    }
    const sec = this.getSecretariaById(id);
    if (!sec) return false;
    const assignedEmployees = this.data.employees.filter(
      (e) => e.secretaria.toLowerCase().includes(sec.sigla.toLowerCase()) || e.secretaria.toLowerCase().includes(sec.nome.toLowerCase())
    );
    if (assignedEmployees.length > 0) {
      throw new Error(
        `N\xE3o \xE9 poss\xEDvel excluir a secretaria ${sec.sigla} pois existem ${assignedEmployees.length} servidor(es) lotado(s) nela. Desative-a ou transfira os servidores antes de excluir.`
      );
    }
    this.data.secretarias = this.data.secretarias.filter((s) => s.id !== sec.id && s.sigla.toUpperCase() !== sec.sigla.toUpperCase());
    this.addAuditLog({
      entity_type: "user",
      entity_id: sec.sigla,
      action: "DELETE",
      details: `Secretaria ${sec.sigla} - ${sec.nome} exclu\xEDda definitivamente do sistema.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return true;
  }
  // --- Doctors CRUD ---
  getDoctors(search, ativoOnly) {
    if (!this.data.doctors) {
      this.data.doctors = [...DEFAULT_DOCTORS];
    }
    let result = [...this.data.doctors];
    if (ativoOnly) {
      result = result.filter((d) => d.ativo);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (d) => d.nome.toLowerCase().includes(q) || d.crm.toLowerCase().includes(q) || d.especialidade && d.especialidade.toLowerCase().includes(q)
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
  getDoctorById(idOrCrm) {
    if (!idOrCrm) return void 0;
    const search = String(idOrCrm).trim();
    const searchLower = search.toLowerCase();
    const searchDigits = search.replace(/\D/g, "");
    return this.getDoctors().find((d) => {
      if (String(d.id).trim() === search) return true;
      if (d.crm.trim().toLowerCase() === searchLower) return true;
      if (searchDigits && searchDigits.length >= 4 && d.crm.replace(/\D/g, "") === searchDigits) return true;
      if (d.nome.toLowerCase().trim() === searchLower) return true;
      return false;
    });
  }
  saveDoctor(doctorData, actorEmail, actorRole) {
    if (!this.data.doctors) {
      this.data.doctors = [...DEFAULT_DOCTORS];
    }
    const cleanNome = doctorData.nome?.trim();
    const cleanCrm = doctorData.crm?.trim();
    if (!cleanNome) {
      throw new Error("O Nome do M\xE9dico \xE9 obrigat\xF3rio.");
    }
    if (!cleanCrm) {
      throw new Error("O N\xFAmero do Registro CRM \xE9 obrigat\xF3rio.");
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const targetIsDiretor = doctorData.is_diretor !== void 0 ? Boolean(doctorData.is_diretor) : void 0;
    if (targetIsDiretor === true) {
      for (const d of this.data.doctors) {
        d.is_diretor = false;
      }
    }
    if (doctorData.id) {
      const index = this.data.doctors.findIndex((d) => d.id === doctorData.id);
      if (index === -1) {
        throw new Error("M\xE9dico n\xE3o encontrado para atualiza\xE7\xE3o.");
      }
      const existing = this.data.doctors[index];
      const updated = {
        ...existing,
        nome: cleanNome,
        crm: cleanCrm,
        especialidade: doctorData.especialidade?.trim() || existing.especialidade || "",
        vinculo: doctorData.vinculo || existing.vinculo || "Efetivo",
        is_diretor: targetIsDiretor !== void 0 ? targetIsDiretor : Boolean(existing.is_diretor),
        ativo: doctorData.ativo !== void 0 ? doctorData.ativo : existing.ativo,
        updated_at: now
      };
      this.data.doctors[index] = updated;
      this.addAuditLog({
        entity_type: "doctor",
        entity_id: updated.crm,
        action: "UPDATE",
        details: `Cadastro do M\xE9dico ${updated.nome} (${updated.crm}) atualizado no IPME. V\xEDnculo: ${updated.vinculo}.${updated.is_diretor ? " Definido como M\xE9dico Diretor da Junta Pericial." : ""}`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return updated;
    } else {
      const duplicate = this.data.doctors.find((d) => d.crm.toLowerCase() === cleanCrm.toLowerCase());
      if (duplicate) {
        throw new Error(`J\xE1 existe um m\xE9dico cadastrado com o CRM ${cleanCrm} (${duplicate.nome}).`);
      }
      const maxId = this.data.doctors.reduce((max, d) => {
        const num = parseInt(d.id, 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      const id = String(maxId + 1);
      const created = {
        id,
        nome: cleanNome,
        crm: cleanCrm,
        especialidade: doctorData.especialidade?.trim() || "Medicina Pericial / Cl\xEDnica",
        vinculo: doctorData.vinculo || "Efetivo",
        is_diretor: targetIsDiretor === true,
        ativo: doctorData.ativo !== void 0 ? doctorData.ativo : true,
        created_at: now,
        updated_at: now,
        created_by: actorEmail
      };
      this.data.doctors.push(created);
      this.addAuditLog({
        entity_type: "doctor",
        entity_id: created.crm,
        action: "CREATE",
        details: `Novo M\xE9dico Perito cadastrado no IPME: ${created.nome} (${created.crm}). V\xEDnculo: ${created.vinculo}.${created.is_diretor ? " Definido como Diretor M\xE9dico." : ""}`,
        changed_by: actorEmail,
        user_role: actorRole
      });
      this.saveToDisk(this.data);
      return created;
    }
  }
  setDoctorDiretor(id, actorEmail, actorRole) {
    const doc = this.getDoctorById(id);
    if (!doc) {
      throw new Error("M\xE9dico n\xE3o encontrado.");
    }
    for (const d of this.data.doctors) {
      d.is_diretor = false;
    }
    doc.is_diretor = true;
    doc.ativo = true;
    doc.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.addAuditLog({
      entity_type: "doctor",
      entity_id: doc.crm,
      action: "UPDATE",
      details: `Dr(a). ${doc.nome} (${doc.crm}) definido como M\xE9dico Diretor da Junta M\xE9dica Pericial Oficial.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return doc;
  }
  deleteDoctor(idOrCrm, actorEmail, actorRole) {
    if (actorRole !== "admin") {
      throw new Error("Apenas Administradores podem excluir m\xE9dicos do cadastro.");
    }
    const doc = this.getDoctorById(idOrCrm);
    if (!doc) return false;
    const wasDirector = Boolean(doc.is_diretor);
    const docIdStr = String(doc.id);
    const docCrmStr = doc.crm.trim().toLowerCase();
    this.data.doctors = this.data.doctors.filter(
      (d) => String(d.id) !== docIdStr && d.crm.trim().toLowerCase() !== docCrmStr
    );
    if (wasDirector && this.data.doctors.length > 0) {
      const nextDirector = this.data.doctors.find((d) => d.ativo) || this.data.doctors[0];
      nextDirector.is_diretor = true;
    }
    this.addAuditLog({
      entity_type: "doctor",
      entity_id: doc.crm,
      action: "DELETE",
      details: `M\xE9dico ${doc.nome} (${doc.crm}) exclu\xEDdo do sistema IPME por ${actorEmail}. Hist\xF3rico pericial arquivado preservado.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return true;
  }
  toggleDoctorStatus(id, actorEmail, actorRole) {
    const doc = this.getDoctorById(id);
    if (!doc) {
      throw new Error("M\xE9dico n\xE3o encontrado.");
    }
    doc.ativo = !doc.ativo;
    doc.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    this.addAuditLog({
      entity_type: "doctor",
      entity_id: doc.crm,
      action: "UPDATE",
      details: `Status do m\xE9dico ${doc.nome} (${doc.crm}) alterado para: ${doc.ativo ? "ATIVO" : "INATIVO"}.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return doc;
  }
  getMetrics() {
    const totalEmployees = this.data.employees.length;
    const totalAtivos = this.data.employees.filter((e) => e.status === "Ativo").length;
    const totalLicencaSaude = this.data.employees.filter((e) => e.status === "Licenciado").length;
    const totalReadaptados = this.data.employees.filter((e) => e.status === "Readaptado").length;
    const recentOccurrences = this.getOccurrences().slice(0, 5);
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const expiringSoon = this.data.occurrences.filter((o) => (o.status === "Ativa" || o.status === "Prorrogada") && o.data_termino >= todayStr && o.data_termino <= next30Days).sort((a, b) => a.data_termino.localeCompare(b.data_termino));
    const secMap = {};
    for (const emp of this.data.employees) {
      const shortSec = emp.secretaria.split(" - ")[0] || emp.secretaria;
      if (!secMap[shortSec]) {
        secMap[shortSec] = { count: 0, licencaCount: 0, readaptadoCount: 0 };
      }
      secMap[shortSec].count++;
      if (emp.status === "Licenciado") secMap[shortSec].licencaCount++;
      if (emp.status === "Readaptado") secMap[shortSec].readaptadoCount++;
    }
    const secretariaBreakdown = Object.entries(secMap).map(([secretaria, stats]) => ({
      secretaria,
      ...stats
    }));
    const leaveTypeBreakdown = [
      { name: "Licen\xE7a Sa\xFAde", value: this.data.occurrences.filter((o) => o.tipo === "Licen\xE7a Sa\xFAde" && (o.status === "Ativa" || o.status === "Prorrogada")).length },
      { name: "Licen\xE7a Maternidade", value: this.data.occurrences.filter((o) => o.tipo === "Licen\xE7a Maternidade" && (o.status === "Ativa" || o.status === "Prorrogada")).length },
      { name: "Licen\xE7a Definitiva", value: this.data.occurrences.filter((o) => o.tipo === "Licen\xE7a Definitiva" && (o.status === "Ativa" || o.status === "Prorrogada")).length },
      { name: "Readapta\xE7\xE3o", value: this.data.occurrences.filter((o) => o.tipo === "Readapta\xE7\xE3o" && (o.status === "Ativa" || o.status === "Prorrogada")).length },
      { name: "Conclu\xEDdas / Hist\xF3ricas", value: this.data.occurrences.filter((o) => o.status === "Conclu\xEDda").length }
    ];
    return {
      totalEmployees,
      totalAtivos,
      totalLicencaSaude,
      totalReadaptados,
      recentOccurrences,
      expiringSoon,
      secretariaBreakdown,
      leaveTypeBreakdown
    };
  }
  addAuditLog(log) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...log
    };
    this.data.audit_logs.unshift(entry);
    if (this.data.audit_logs.length > 500) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 500);
    }
  }
  calculateDays(start, end) {
    if (!start || !end) return 0;
    const s = /* @__PURE__ */ new Date(start + "T00:00:00");
    const e = /* @__PURE__ */ new Date(end + "T00:00:00");
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diff = e.getTime() - s.getTime();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1e3 * 60 * 60 * 24)) + 1;
  }
  importCadastroCSV(csvText, substituirExistentes, actorEmail, actorRole) {
    const parsed = parseServidoresCSV(csvText);
    if (parsed.erros.length > 0 && parsed.rows.length === 0) {
      throw new Error(`Erro ao processar CSV: ${parsed.erros.join("; ")}`);
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (substituirExistentes) {
      const totalAntigo = this.data.employees.length;
      const totalLicencasAntigo = this.data.occurrences.length;
      this.data.employees = [];
      this.data.occurrences = [];
      this.addAuditLog({
        entity_type: "employee",
        entity_id: "ALL",
        action: "DELETE",
        details: `Reset total de servidores e licen\xE7as para nova importa\xE7\xE3o CSV. Removidos: ${totalAntigo} servidores e ${totalLicencasAntigo} licen\xE7as anteriores.`,
        changed_by: actorEmail,
        user_role: actorRole
      });
    }
    let secretariasImportadas = 0;
    let secretariasAtualizadas = 0;
    for (const secItem of parsed.secretarias) {
      if (/SEC-\d{3}\.\d{3}\.\d{3}-\d{2}/.test(secItem.id) || /\d{3}\.\d{3}\.\d{3}-\d{2}/.test(secItem.sigla) || /^\d{3}$/.test(secItem.nome)) {
        continue;
      }
      const idx = this.data.secretarias.findIndex(
        (s) => s.id === secItem.id || s.sigla.toUpperCase() === secItem.sigla.toUpperCase() || s.nome.toLowerCase() === secItem.nome.toLowerCase()
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
          created_by: actorEmail
        });
        secretariasImportadas++;
      }
    }
    let servidoresImportados = 0;
    let servidoresAtualizados = 0;
    for (const row of parsed.rows) {
      const idx = this.data.employees.findIndex((e) => e.matricula.trim() === row.matricula.trim());
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
          updated_at: now
        };
        if (row.cargo) {
          this.data.occurrences.forEach((occ) => {
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
          cargo: row.cargo || "Servidor Municipal",
          status: "Ativo",
          data_admissao: row.data_admissao,
          email: row.email,
          created_at: now,
          updated_at: now,
          created_by: actorEmail
        });
        servidoresImportados++;
      }
    }
    this.addAuditLog({
      entity_type: "employee",
      entity_id: "IMPORT_CSV",
      action: "CREATE",
      details: `Importa\xE7\xE3o em lote via CSV conclu\xEDda: ${servidoresImportados} novos servidores inseridos, ${servidoresAtualizados} atualizados, ${secretariasImportadas} secretarias criadas. Telefones formatados: ${parsed.telefonesValidos}, ignorados: ${parsed.telefonesIgnorados}.`,
      changed_by: actorEmail,
      user_role: actorRole
    });
    this.saveToDisk(this.data);
    return {
      totalLinhas: parsed.totalRows,
      servidoresImportados,
      servidoresAtualizados,
      secretariasImportadas,
      secretariasAtualizadas,
      telefonesFormatados: parsed.telefonesValidos,
      telefonesIgnorados: parsed.telefonesIgnorados,
      erros: parsed.erros
    };
  }
};
var db = new DatabaseManager();

// src/server/emailService.ts
import nodemailer from "nodemailer";
var EmailService = class {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initTransporter();
  }
  initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: {
            user,
            pass
          },
          tls: {
            rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false"
          }
        });
        this.isConfigured = true;
        console.log(`[EmailService] Transporter SMTP configurado: ${host}:${port} (${user})`);
      } catch (err) {
        console.error("[EmailService] Falha ao configurar transportador SMTP:", err);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.log("[EmailService] SMTP n\xE3o configurado no ambiente (.env). Operando em Modo Simula\xE7\xE3o / Sandbox.");
    }
  }
  getStatus() {
    return {
      isConfigured: this.isConfigured,
      host: process.env.SMTP_HOST || "N\xE3o configurado (Simula\xE7\xE3o)",
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : void 0,
      user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2})(.*)(@.*)/, "$1***$3") : void 0,
      from: process.env.SMTP_FROM || "IPME - Notifica\xE7\xF5es <noreply@ipmeusebio.ce.gov.br>"
    };
  }
  /**
   * Envia o e-mail de confirmação de cadastro e código de 6 dígitos
   */
  async sendConfirmationEmail(to, recipientName, code, temporaryPassword, appUrl) {
    const from = process.env.SMTP_FROM || '"IPME - Instituto de Previd\xEAncia de Eus\xE9bio" <atendimento@ipmeusebio.ce.gov.br>';
    const subject = `[IPME] C\xF3digo de Confirma\xE7\xE3o de Cadastro: ${code}`;
    const baseUrl = appUrl || process.env.APP_URL || "https://ais-pre-pcjbglmhysuprzhnlrvneb-534607352231.us-east1.run.app";
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Confirma\xE7\xE3o de Cadastro IPME</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f223d, #1b3f6e); padding: 28px 24px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-block; background-color: #ffffff; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 16px; color: #0f223d; letter-spacing: 1px; margin-bottom: 8px; }
    .header h1 { margin: 8px 0 0; font-size: 18px; font-weight: 700; color: #f8fafc; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
    .content { padding: 28px 24px; line-height: 1.6; font-size: 14px; color: #334155; }
    .code-box { background-color: #f8fafc; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
    .code-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #065f46; letter-spacing: 1px; margin-bottom: 6px; }
    .pin-code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #047857; margin: 6px 0; }
    .info-card { background-color: #0f223d; color: #ffffff; border-radius: 10px; padding: 14px 16px; margin: 18px 0; font-size: 12px; }
    .info-card table { width: 100%; border-collapse: collapse; }
    .info-card td { padding: 4px 0; }
    .info-label { color: #94a3b8; width: 130px; }
    .info-value { font-weight: 600; color: #f8fafc; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px; text-align: center; margin: 16px 0; }
    .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">IPME</div>
      <h1>Instituto de Previd\xEAncia do Munic\xEDpio de Eus\xE9bio</h1>
      <p>Sistema Eletr\xF4nico de Homologa\xE7\xE3o de Licen\xE7as & Readapta\xE7\xF5es</p>
    </div>

    <div class="content">
      <p>Prezado(a) <strong>${recipientName}</strong>,</p>
      
      <p>Seu acesso como operador corporativo no Sistema Pericial do <strong>IPME (Prefeitura de Eus\xE9bio)</strong> foi criado pelo Administrador Geral do \xF3rg\xE3o.</p>
      
      <p>Para confirmar a autenticidade do seu endere\xE7o institucional e ativar seu acesso pericial, utilize o c\xF3digo de 6 d\xEDgitos abaixo:</p>

      <div class="code-box">
        <div class="code-title">C\xF3digo PIN de Confirma\xE7\xE3o & Ativa\xE7\xE3o</div>
        <div class="pin-code">${code}</div>
        <div style="font-size: 11px; color: #64748b;">V\xE1lido para libera\xE7\xE3o de acesso imediata</div>
      </div>

      <div class="info-card">
        <table>
          <tr>
            <td class="info-label">E-mail Corporativo:</td>
            <td class="info-value">${to}</td>
          </tr>
          ${temporaryPassword ? `
          <tr>
            <td class="info-label">Senha Inicial:</td>
            <td class="info-value" style="color: #fbbf24;">${temporaryPassword}</td>
          </tr>` : ""}
          <tr>
            <td class="info-label">Autarquia:</td>
            <td class="info-value">IPME \xB7 Eus\xE9bio - CE</td>
          </tr>
        </table>
      </div>

      <p style="text-align: center;">
        <a href="${baseUrl}" class="btn" style="color: #ffffff;">Acessar Portal do IPME</a>
      </p>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        * Por diretrizes de conformidade previdenci\xE1ria e seguran\xE7a da informa\xE7\xE3o, recomendamos a substitui\xE7\xE3o da senha inicial ap\xF3s o primeiro acesso.
      </p>
    </div>

    <div class="footer">
      <strong>IPME \xB7 Instituto de Previd\xEAncia do Munic\xEDpio de Eus\xE9bio</strong><br>
      Autarquia Municipal Criada pela Lei n\xBA 465/2002 \xB7 Cear\xE1<br>
      Rua Irm\xE3 Ambrosina, 85 - Centro, Eus\xE9bio - CE \xB7 Tel: (85) 3260-9900
    </div>
  </div>
</body>
</html>
    `;
    const text = `
IPME - Instituto de Previd\xEAncia do Munic\xEDpio de Eus\xE9bio
Confirma\xE7\xE3o de Cadastro de Acesso Pericial

Prezado(a) ${recipientName},

Seu acesso no Sistema Pericial do IPME foi criado pelo Administrador Geral.

C\xF3digo PIN de Confirma\xE7\xE3o: ${code}

E-mail: ${to}
${temporaryPassword ? `Senha Inicial: ${temporaryPassword}` : ""}
Acesse: ${baseUrl}

IPME \xB7 Prefeitura Municipal de Eus\xE9bio - Cear\xE1 (Lei n\xBA 465/2002)
    `.trim();
    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html
        });
        console.log(`[EmailService] E-mail REAL despachado via SMTP para ${to}. MessageId: ${info.messageId}`);
        return {
          sent: true,
          simulated: false,
          messageId: info.messageId,
          provider: "SMTP"
        };
      } catch (error) {
        console.error(`[EmailService] Erro ao enviar e-mail via SMTP para ${to}:`, error);
        return {
          sent: false,
          simulated: false,
          error: error.message || "Erro ao conectar ao servidor SMTP.",
          provider: "SMTP (Falha)"
        };
      }
    } else {
      console.log(`[EmailService - SIMULA\xC7\xC3O] C\xF3digo gerado para ${to}: ${code}`);
      return {
        sent: true,
        simulated: true,
        provider: "Sandbox (Simula\xE7\xE3o sem SMTP)"
      };
    }
  }
  /**
   * Envia e-mail de teste para validação de SMTP pelo Administrador
   */
  async sendTestEmail(to) {
    if (!this.isConfigured || !this.transporter) {
      return {
        sent: false,
        simulated: true,
        error: "Servidor SMTP n\xE3o configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS nas vari\xE1veis de ambiente.",
        provider: "Sandbox"
      };
    }
    const from = process.env.SMTP_FROM || '"IPME - Eus\xE9bio" <atendimento@ipmeusebio.ce.gov.br>';
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject: "[IPME] Teste de Conex\xE3o SMTP com Sucesso",
        text: "Este \xE9 um e-mail de teste disparado pelo Sistema Pericial do IPME (Eus\xE9bio - CE). A conex\xE3o com o servidor SMTP est\xE1 funcionando perfeitamente!",
        html: `
          <div style="font-family: sans-serif; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #0f223d;">Teste de Conex\xE3o SMTP - IPME</h2>
            <p>Parab\xE9ns! O servidor de e-mail institucional est\xE1 <strong>conectado e enviando mensagens reais</strong> com sucesso para <strong>${to}</strong>.</p>
            <p style="color: #64748b; font-size: 12px;">Prefeitura Municipal de Eus\xE9bio - Cear\xE1 \xB7 RPPS</p>
          </div>
        `
      });
      return {
        sent: true,
        simulated: false,
        messageId: info.messageId,
        provider: "SMTP"
      };
    } catch (err) {
      return {
        sent: false,
        simulated: false,
        error: err.message || "Falha no teste SMTP.",
        provider: "SMTP (Falha)"
      };
    }
  }
};
var emailService = new EmailService();

// server.ts
dotenv.config();
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));
  function getActor(req) {
    const actorEmail = req.headers["x-user-email"] || req.body?.actorEmail || "Pliniocatunda@gmail.com";
    const actorRole = req.headers["x-user-role"] || req.body?.actorRole || "admin";
    return { actorEmail, actorRole };
  }
  function getTenantId(req) {
    const headerTenant = req.headers["x-tenant-id"];
    if (headerTenant && headerTenant.trim()) {
      return headerTenant.trim();
    }
    const bodyTenant = req.body?.tenantId;
    if (bodyTenant && bodyTenant.trim()) {
      return bodyTenant.trim();
    }
    const queryTenant = req.query?.tenantId;
    if (queryTenant && queryTenant.trim()) {
      return queryTenant.trim();
    }
    return "ipme_eusebio";
  }
  function getTenantDb(req) {
    return db.forTenant(getTenantId(req));
  }
  app.get("/api/tenants", (_req, res) => {
    try {
      const tenants = db.getTenants();
      res.json({ success: true, data: tenants });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/tenants/current", (req, res) => {
    try {
      const tid = getTenantId(req);
      const tenant = db.getTenantById(tid) || db.getTenantById("ipme_eusebio");
      res.json({ success: true, data: tenant });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/tenants", (req, res) => {
    try {
      const { actorRole } = getActor(req);
      if (actorRole !== "admin") {
        return res.status(403).json({ success: false, message: "Apenas Administradores podem registrar novos clientes." });
      }
      const saved = db.saveTenant(req.body);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/tenants/reset-sandbox", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== "admin") {
        return res.status(403).json({ success: false, message: "Apenas Administradores podem reiniciar a base de testes." });
      }
      db.resetSandbox(actorEmail);
      res.json({ success: true, message: "Ambiente de testes (Studio Sandbox) reinicializado com sucesso." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/stats", (req, res) => {
    try {
      const metrics = getTenantDb(req).getMetrics();
      res.json({ success: true, data: metrics });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/employees", (req, res) => {
    try {
      const { search, secretaria, status } = req.query;
      const employees = getTenantDb(req).getEmployees(search, secretaria, status);
      res.json({ success: true, data: employees, count: employees.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/employees/:matricula", (req, res) => {
    try {
      const emp = getTenantDb(req).getEmployeeByMatricula(req.params.matricula);
      if (!emp) {
        return res.status(404).json({ success: false, message: "Servidor n\xE3o encontrado." });
      }
      const history = getTenantDb(req).getOccurrences(emp.matricula);
      res.json({ success: true, data: { ...emp, history } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/employees", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { matricula, nome, cpf, telefone, secretaria, setor, cargo, status, data_admissao, email } = req.body;
      if (!matricula || !nome || !cpf) {
        return res.status(400).json({ success: false, message: "Matr\xEDcula, Nome e CPF s\xE3o obrigat\xF3rios." });
      }
      const saved = getTenantDb(req).saveEmployee(
        { matricula, nome, cpf, telefone, secretaria, setor, cargo, status, data_admissao, email },
        actorEmail,
        actorRole
      );
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.put("/api/employees/:matricula", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const saved = getTenantDb(req).saveEmployee(
        { ...req.body, matricula: req.params.matricula },
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/employees/:matricula", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== "admin") {
        return res.status(403).json({ success: false, message: "Apenas Administradores podem excluir servidores." });
      }
      const deleted = getTenantDb(req).deleteEmployee(req.params.matricula, actorEmail, actorRole);
      if (!deleted) {
        return res.status(404).json({ success: false, message: "Servidor n\xE3o encontrado." });
      }
      res.json({ success: true, message: "Servidor exclu\xEDdo com sucesso." });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/admin/clear-employees", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== "admin") {
        return res.status(403).json({ success: false, message: "Apenas Administradores podem limpar o cadastro de servidores." });
      }
      const result = getTenantDb(req).clearAllEmployees(actorEmail, actorRole);
      res.json({ success: true, message: "Cadastro de servidores apagado com sucesso.", data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/admin/import-csv", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { csvText, substituirExistentes } = req.body;
      if (!csvText || typeof csvText !== "string") {
        return res.status(400).json({ success: false, message: "Conte\xFAdo CSV n\xE3o fornecido." });
      }
      const result = getTenantDb(req).importCadastroCSV(csvText, Boolean(substituirExistentes), actorEmail, actorRole);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.get("/api/occurrences", (req, res) => {
    try {
      const { matricula, tipo, status, dataInicio, dataTermino } = req.query;
      const list = getTenantDb(req).getOccurrences(matricula, tipo, status, dataInicio, dataTermino);
      res.json({ success: true, data: list, count: list.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/occurrences/:id", (req, res) => {
    try {
      const occ = getTenantDb(req).getOccurrenceById(req.params.id);
      if (!occ) {
        return res.status(404).json({ success: false, message: "Ocorr\xEAncia n\xE3o encontrada." });
      }
      res.json({ success: true, data: occ });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/occurrences", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { matricula, tipo, data_inicio, data_termino, cid, medico_perito, crm, anexo_url, anexo_nome, observacoes, parecer_tecnico } = req.body;
      if (!matricula || !tipo || !data_inicio || !data_termino) {
        return res.status(400).json({ success: false, message: "Matr\xEDcula, tipo e datas de in\xEDcio e t\xE9rmino s\xE3o obrigat\xF3rios." });
      }
      if (tipo === "Licen\xE7a Definitiva") {
        return res.status(400).json({
          success: false,
          message: "A Licen\xE7a Definitiva n\xE3o pode ser cadastrada diretamente como uma nova ocorr\xEAncia. Ela deve ser originada a partir da transforma\xE7\xE3o de uma licen\xE7a j\xE1 ativa ou prorrogada com a devida Data da Concess\xE3o."
        });
      }
      const saved = getTenantDb(req).saveOccurrence(
        { matricula, tipo, data_inicio, data_termino, cid, medico_perito, crm, anexo_url, anexo_nome, observacoes, parecer_tecnico },
        actorEmail,
        actorRole
      );
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.put("/api/occurrences/:id", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const saved = getTenantDb(req).saveOccurrence(
        { ...req.body, id: req.params.id },
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/occurrences/:id/prorrogar", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { novaDataTermino, motivo, medico, crm } = req.body;
      if (!novaDataTermino) {
        return res.status(400).json({ success: false, message: "Nova data de t\xE9rmino \xE9 obrigat\xF3ria." });
      }
      const updated = getTenantDb(req).prorrogarOccurrence(req.params.id, novaDataTermino, motivo || "Prorroga\xE7\xE3o pericial deferida", medico, crm, actorEmail, actorRole);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/occurrences/:id/concluir", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { parecerFinal, dataConcessao, atoConcessao } = req.body;
      const updated = getTenantDb(req).concluirOccurrence(req.params.id, parecerFinal, actorEmail, actorRole, dataConcessao, atoConcessao);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/occurrences/:id/retorno-trabalho", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { dataRetorno, motivoRetorno, medico, crm, atoReversao } = req.body;
      if (!dataRetorno) {
        return res.status(400).json({ success: false, message: "Data do Retorno ao Trabalho \xE9 obrigat\xF3ria." });
      }
      const updated = getTenantDb(req).retornarTrabalhoOccurrence(
        req.params.id,
        dataRetorno,
        motivoRetorno,
        medico,
        crm,
        atoReversao,
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/occurrences/:id/converter-definitiva", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { dataConcessao, atoConcessao, motivo, medico, crm, parecerTecnico } = req.body;
      if (!dataConcessao) {
        return res.status(400).json({ success: false, message: "A Data da Concess\xE3o \xE9 obrigat\xF3ria para tornar a licen\xE7a definitiva." });
      }
      const occ = getTenantDb(req).getOccurrenceById(req.params.id);
      if (!occ) {
        return res.status(404).json({ success: false, message: "Ocorr\xEAncia n\xE3o encontrada." });
      }
      if (occ.data_termino && dataConcessao <= occ.data_termino) {
        return res.status(400).json({
          success: false,
          message: `A licen\xE7a permanente n\xE3o poder\xE1 ser concedida dentro do prazo vigente de licen\xE7a (vigente at\xE9 ${occ.data_termino}). A Data da Concess\xE3o deve ser posterior ao t\xE9rmino da licen\xE7a atual.`
        });
      }
      const updated = getTenantDb(req).converterOccurrenceDefinitiva(
        req.params.id,
        dataConcessao,
        atoConcessao,
        motivo,
        medico,
        crm,
        parecerTecnico,
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/occurrences/:id/cancelar", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { motivo } = req.body;
      const updated = getTenantDb(req).cancelarOccurrence(req.params.id, motivo || "Cancelamento solicitado", actorEmail, actorRole);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/occurrences/:id", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== "admin") {
        return res.status(403).json({ success: false, message: "Apenas Administradores podem excluir afastamentos definitivamente." });
      }
      const ok = getTenantDb(req).deleteOccurrence(req.params.id, actorEmail, actorRole);
      if (!ok) return res.status(404).json({ success: false, message: "Ocorr\xEAncia n\xE3o encontrada." });
      res.json({ success: true, message: "Registro exclu\xEDdo com sucesso." });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/admin/clear-occurrences", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const count = getTenantDb(req).clearOccurrences(actorEmail, actorRole);
      res.json({ success: true, message: `${count} ocorr\xEAncias exclu\xEDdas com sucesso. Todos os servidores mantidos e ativos.`, data: { deletedOccurrences: count } });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.get("/api/audit-logs", (req, res) => {
    try {
      const { entityType, search } = req.query;
      const logs = getTenantDb(req).getAuditLogs(entityType, search);
      res.json({ success: true, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/users", (req, res) => {
    try {
      const users = getTenantDb(req).getUsers();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/users", async (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const user = getTenantDb(req).saveUser(req.body, actorEmail, actorRole);
      let emailDispatch = null;
      if (user.confirmation_code && user.email_verified === false) {
        emailDispatch = await emailService.sendConfirmationEmail(
          user.email,
          user.name,
          user.confirmation_code,
          user.password
        );
      }
      res.status(201).json({ success: true, data: user, emailDispatch });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.put("/api/users/:email", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const user = getTenantDb(req).saveUser({ ...req.body, email: req.params.email }, actorEmail, actorRole);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/users/:email", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      getTenantDb(req).deleteUser?.(req.params.email, actorEmail, actorRole);
      res.json({ success: true, message: "Operador exclu\xEDdo com sucesso." });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.get("/api/secretarias", (req, res) => {
    try {
      const { search, apenasAtivas } = req.query;
      const secretarias = getTenantDb(req).getSecretarias(search, apenasAtivas === "true");
      res.json({ success: true, data: secretarias, count: secretarias.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/secretarias/:id", (req, res) => {
    try {
      const sec = getTenantDb(req).getSecretariaById(req.params.id);
      if (!sec) {
        return res.status(404).json({ success: false, message: "Secretaria n\xE3o encontrada." });
      }
      res.json({ success: true, data: sec });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/secretarias", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { sigla, nome, secretario, email, telefone, endereco, ativa } = req.body;
      if (!sigla || !nome) {
        return res.status(400).json({ success: false, message: "Sigla e Nome da Secretaria s\xE3o obrigat\xF3rios." });
      }
      const saved = getTenantDb(req).saveSecretaria(
        { sigla, nome, secretario, email, telefone, endereco, ativa },
        actorEmail,
        actorRole
      );
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.put("/api/secretarias/:id", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const saved = getTenantDb(req).saveSecretaria(
        { ...req.body, id: req.params.id },
        actorEmail,
        actorRole
      );
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/secretarias/:id", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== "admin") {
        return res.status(403).json({ success: false, message: "Apenas Administradores podem excluir secretarias." });
      }
      const ok = getTenantDb(req).deleteSecretaria(req.params.id, actorEmail, actorRole);
      if (!ok) return res.status(404).json({ success: false, message: "Secretaria n\xE3o encontrada." });
      res.json({ success: true, message: "Secretaria exclu\xEDda com sucesso." });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.get("/api/doctors", (req, res) => {
    try {
      const { search, apenasAtivos } = req.query;
      const doctors = getTenantDb(req).getDoctors(search, apenasAtivos === "true");
      res.json({ success: true, data: doctors, count: doctors.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.get("/api/doctors/:id", (req, res) => {
    try {
      const doc = getTenantDb(req).getDoctorById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: "M\xE9dico n\xE3o encontrado." });
      }
      res.json({ success: true, data: doc });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/doctors", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const { nome, crm, especialidade, ativo, vinculo, is_diretor } = req.body;
      if (!nome || !crm) {
        return res.status(400).json({ success: false, message: "Nome e N\xFAmero de CRM s\xE3o obrigat\xF3rios." });
      }
      const saved = getTenantDb(req).saveDoctor({ nome, crm, especialidade, ativo, vinculo, is_diretor }, actorEmail, actorRole);
      res.status(201).json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.put("/api/doctors/:id", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const saved = getTenantDb(req).saveDoctor({ ...req.body, id: doctorIdOrCrm }, actorEmail, actorRole);
      res.json({ success: true, data: saved });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/doctors/:id/set-diretor", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const doc = getTenantDb(req).setDoctorDiretor(doctorIdOrCrm, actorEmail, actorRole);
      res.json({ success: true, data: doc });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.patch("/api/doctors/:id/toggle", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const doc = getTenantDb(req).toggleDoctorStatus(doctorIdOrCrm, actorEmail, actorRole);
      res.json({ success: true, data: doc });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.delete("/api/doctors/:id", (req, res) => {
    try {
      const { actorEmail, actorRole } = getActor(req);
      if (actorRole !== "admin") {
        return res.status(403).json({ success: false, message: "Apenas Administradores podem excluir m\xE9dicos." });
      }
      const doctorIdOrCrm = decodeURIComponent(req.params.id);
      const ok = getTenantDb(req).deleteDoctor(doctorIdOrCrm, actorEmail, actorRole);
      if (!ok) return res.status(404).json({ success: false, message: "M\xE9dico n\xE3o localizado no cadastro." });
      res.json({ success: true, message: "M\xE9dico exclu\xEDdo com sucesso." });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, name, provider, password } = req.body;
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: "Email \xE9 obrigat\xF3rio para autentica\xE7\xE3o." });
      }
      const emailNorm = email.trim().toLowerCase();
      const isMaster = emailNorm === "pliniocatunda@gmail.com";
      const users = getTenantDb(req).getUsers();
      let user = users.find((u) => u.email.toLowerCase() === emailNorm);
      if (!user) {
        if (isMaster) {
          user = getTenantDb(req).saveUser(
            {
              email: "Pliniocatunda@gmail.com",
              name: name || "Pl\xEDnio Catunda (Administrador Master)",
              role: "admin",
              auth_provider: "google",
              department: "IPME - Presid\xEAncia & Governan\xE7a",
              cargo: "Administrador Geral & Master do Sistema",
              ativo: true,
              password: password || "IpmeMaster@2026",
              email_verified: true,
              must_change_password: false,
              avatar_url: "/logo-ipme.png"
            },
            "Sistema IPME",
            "admin"
          );
        } else {
          return res.status(403).json({
            success: false,
            message: `O e-mail corporativo "${email}" n\xE3o est\xE1 cadastrado. Apenas operadores previamente cadastrados pelo Administrador Master (pliniocatunda@gmail.com) possuem permiss\xE3o de acesso ao sistema.`
          });
        }
      }
      if (user.ativo === false) {
        return res.status(403).json({
          success: false,
          message: `O acesso do operador "${user.name}" est\xE1 inativo. Solicite a reativa\xE7\xE3o ao Administrador Master.`
        });
      }
      if (provider === "google") {
        if (!isMaster) {
          return res.status(403).json({
            success: false,
            message: "Acesso negado. Apenas a conta Google oficial (pliniocatunda@gmail.com) tem permiss\xE3o de Administrador Master."
          });
        }
      } else {
        const userPassword = user.password || (isMaster ? "IpmeMaster@2026" : "Ipme@2026");
        if (!password || !password.trim()) {
          return res.status(401).json({
            success: false,
            message: "Por favor, informe sua senha de acesso para entrar no sistema."
          });
        }
        if (userPassword !== password.trim()) {
          return res.status(401).json({
            success: false,
            message: "Senha de acesso incorreta. Verifique os caracteres e tente novamente."
          });
        }
      }
      user.last_login = (/* @__PURE__ */ new Date()).toISOString();
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/logout", (_req, res) => {
    res.json({ success: true, message: "Sess\xE3o encerrada com sucesso." });
  });
  app.post("/api/auth/confirm-email", (req, res) => {
    try {
      const { email, code, token } = req.body;
      const { actorEmail } = getActor(req);
      const user = getTenantDb(req).confirmEmail(email, code || token, actorEmail);
      res.json({ success: true, message: "Cadastro e e-mail confirmados com sucesso! Voc\xEA j\xE1 pode realizar login.", data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/resend-confirmation", async (req, res) => {
    try {
      const { email } = req.body;
      const { actorEmail } = getActor(req);
      const result = getTenantDb(req).resendConfirmationEmail(email, actorEmail);
      const emailDispatch = await emailService.sendConfirmationEmail(
        result.email,
        result.name,
        result.code
      );
      res.json({
        success: true,
        message: "Novo c\xF3digo de confirma\xE7\xE3o gerado e enviado para o e-mail corporativo.",
        data: result,
        emailDispatch
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  app.get("/api/admin/email-status", (_req, res) => {
    res.json({ success: true, data: emailService.getStatus() });
  });
  app.post("/api/admin/test-email", async (req, res) => {
    try {
      const { to } = req.body;
      if (!to) {
        return res.status(400).json({ success: false, message: "Informe o endere\xE7o de e-mail de destino para o teste." });
      }
      const result = await emailService.sendTestEmail(to);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  app.post("/api/auth/change-password", (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const { actorEmail } = getActor(req);
      const user = getTenantDb(req).changePassword(email, currentPassword, newPassword, actorEmail);
      res.json({ success: true, message: "Senha de acesso alterada com sucesso!", data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path2.resolve(__dirname2, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(__dirname2, "dist", "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server IPME running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
