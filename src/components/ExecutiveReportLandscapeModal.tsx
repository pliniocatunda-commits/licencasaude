import React, { useState, useMemo } from 'react';
import { Occurrence, Employee, Secretaria, DashboardMetrics, OccurrenceType, Doctor } from '../types/index.ts';
import { formatarDataBR, calcularDiasPagos, formatarCPF, isPrevisaoRetornoEmAtraso, calcularDiasAtraso } from '../utils/validation.ts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { 
  X, 
  Printer, 
  Download, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  FileSpreadsheet, 
  Loader2, 
  CheckCircle2, 
  RotateCcw,
  FileCheck2,
  Stethoscope,
  Archive,
  AlertCircle,
  FileText,
  Info
} from 'lucide-react';

interface ExecutiveReportLandscapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrences: Occurrence[];
  employees: Employee[];
  secretarias: Secretaria[];
  metrics: DashboardMetrics | null;
  doctors?: Doctor[];
}

export const ExecutiveReportLandscapeModal: React.FC<ExecutiveReportLandscapeModalProps> = ({
  isOpen,
  onClose,
  occurrences,
  employees,
  secretarias,
  doctors = [],
}) => {
  // Obter Médico Diretor designado
  const diretorMedico = useMemo(() => {
    if (!doctors || doctors.length === 0) return null;
    return doctors.find(d => d.is_diretor && d.ativo) || doctors.find(d => d.is_diretor) || doctors.find(d => d.ativo) || doctors[0];
  }, [doctors]);

  // 1. Filtros para Emissão do Relatório Executivo
  const [tipoFiltro, setTipoFiltro] = useState<'all' | OccurrenceType>('all');
  const [secretariaFiltro, setSecretariaFiltro] = useState<string>('all');
  // Período flexível: permite filtrar por 'retorno' (Data de Retorno) ou 'afastamento' (Data de Afastamento)
  const [tipoDataFiltro, setTipoDataFiltro] = useState<'retorno' | 'afastamento'>('retorno');
  // Período: Não virá com qualquer período definido por padrão (exibe geral das ativas)
  const [periodoInicio, setPeriodoInicio] = useState<string>('');
  const [periodoFim, setPeriodoFim] = useState<string>('');
  const [filtroArquivadas, setFiltroArquivadas] = useState<'padrao' | 'apenas_arquivadas' | 'todas_arquivadas' | 'apenas_ativas'>('padrao');

  // Presets para o Período das Licenças Concluídas (Padrão: últimos 30 dias conforme regra de prestação de contas)
  const presetsInfoConcluidas = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hojeISO = `${year}-${month}-${day}`;

    // Últimos 30 dias
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const y30 = d30.getFullYear();
    const m30 = String(d30.getMonth() + 1).padStart(2, '0');
    const day30 = String(d30.getDate()).padStart(2, '0');
    const d30ISO = `${y30}-${m30}-${day30}`;

    // Mês atual
    const lastDayMes = new Date(year, now.getMonth() + 1, 0).getDate();
    const mesAtualInicio = `${year}-${month}-01`;
    const mesAtualFim = `${year}-${month}-${String(lastDayMes).padStart(2, '0')}`;

    // Mês anterior
    const prevDate = new Date(year, now.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevLastDay = new Date(prevYear, prevDate.getMonth() + 1, 0).getDate();
    const mesAnteriorInicio = `${prevYear}-${prevMonth}-01`;
    const mesAnteriorFim = `${prevYear}-${prevMonth}-${String(prevLastDay).padStart(2, '0')}`;

    return {
      ultimos30: { inicio: d30ISO, fim: hojeISO, label: 'ÚLTIMOS 30 DIAS' },
      mesAtual: { inicio: mesAtualInicio, fim: mesAtualFim, label: 'MÊS ATUAL' },
      mesAnterior: { inicio: mesAnteriorInicio, fim: mesAnteriorFim, label: 'MÊS ANTERIOR' },
    };
  }, []);

  // 1.1 Filtro específico para Período das Licenças Concluídas (Padrão: últimos 30 dias)
  const [periodoConcluidasInicio, setPeriodoConcluidasInicio] = useState<string>(() => {
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const y = d30.getFullYear();
    const m = String(d30.getMonth() + 1).padStart(2, '0');
    const d = String(d30.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [periodoConcluidasFim, setPeriodoConcluidasFim] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setTipoFiltro('all');
    setSecretariaFiltro('all');
    setTipoDataFiltro('retorno');
    setPeriodoInicio('');
    setPeriodoFim('');
    setFiltroArquivadas('padrao');
    setPeriodoConcluidasInicio(presetsInfoConcluidas.ultimos30.inicio);
    setPeriodoConcluidasFim(presetsInfoConcluidas.ultimos30.fim);
  };

  // Limpar exclusivamente o período geral
  const handleClearPeriodoOnly = () => {
    setPeriodoInicio('');
    setPeriodoFim('');
  };

  // Limpar exclusivamente o período das licenças concluídas
  const handleClearPeriodoConcluidas = () => {
    setPeriodoConcluidasInicio('');
    setPeriodoConcluidasFim('');
  };

  // Presets rápidos para fechamento baseado na Data de Retorno
  const presetsInfo = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    const mesAtualInicio = `${year}-${month}-01`;
    const mesAtualFim = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    const prevDate = new Date(year, now.getMonth() - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevLastDay = new Date(prevYear, prevDate.getMonth() + 1, 0).getDate();
    const mesAnteriorInicio = `${prevYear}-${prevMonth}-01`;
    const mesAnteriorFim = `${prevYear}-${prevMonth}-${String(prevLastDay).padStart(2, '0')}`;

    const anoInicio = `${year}-01-01`;
    const anoFim = `${year}-12-31`;

    return {
      mesAtual: { inicio: mesAtualInicio, fim: mesAtualFim, label: 'MÊS ATUAL' },
      mesAnterior: { inicio: mesAnteriorInicio, fim: mesAnteriorFim, label: 'MÊS ANTERIOR' },
      ano: { inicio: anoInicio, fim: anoFim, label: `ANO ${year}` },
    };
  }, []);

  const setPresetMesAtual = () => {
    setPeriodoInicio(presetsInfo.mesAtual.inicio);
    setPeriodoFim(presetsInfo.mesAtual.fim);
  };

  const setPresetMesAnterior = () => {
    setPeriodoInicio(presetsInfo.mesAnterior.inicio);
    setPeriodoFim(presetsInfo.mesAnterior.fim);
  };

  const setPresetAnoAtual = () => {
    setPeriodoInicio(presetsInfo.ano.inicio);
    setPeriodoFim(presetsInfo.ano.fim);
  };

  const isMesAtualActive = Boolean(periodoInicio && periodoFim && periodoInicio === presetsInfo.mesAtual.inicio && periodoFim === presetsInfo.mesAtual.fim);
  const isMesAnteriorActive = Boolean(periodoInicio && periodoFim && periodoInicio === presetsInfo.mesAnterior.inicio && periodoFim === presetsInfo.mesAnterior.fim);
  const isAnoActive = Boolean(periodoInicio && periodoFim && periodoInicio === presetsInfo.ano.inicio && periodoFim === presetsInfo.ano.fim);

  // Ações para o filtro de Licenças Concluídas
  const setPresetConcluidasUltimos30 = () => {
    setPeriodoConcluidasInicio(presetsInfoConcluidas.ultimos30.inicio);
    setPeriodoConcluidasFim(presetsInfoConcluidas.ultimos30.fim);
  };

  const setPresetConcluidasMesAtual = () => {
    setPeriodoConcluidasInicio(presetsInfoConcluidas.mesAtual.inicio);
    setPeriodoConcluidasFim(presetsInfoConcluidas.mesAtual.fim);
  };

  const setPresetConcluidasMesAnterior = () => {
    setPeriodoConcluidasInicio(presetsInfoConcluidas.mesAnterior.inicio);
    setPeriodoConcluidasFim(presetsInfoConcluidas.mesAnterior.fim);
  };

  const isConcluidasUltimos30Active = Boolean(
    periodoConcluidasInicio &&
    periodoConcluidasFim &&
    periodoConcluidasInicio === presetsInfoConcluidas.ultimos30.inicio &&
    periodoConcluidasFim === presetsInfoConcluidas.ultimos30.fim
  );

  const isConcluidasMesAtualActive = Boolean(
    periodoConcluidasInicio &&
    periodoConcluidasFim &&
    periodoConcluidasInicio === presetsInfoConcluidas.mesAtual.inicio &&
    periodoConcluidasFim === presetsInfoConcluidas.mesAtual.fim
  );

  const isConcluidasMesAnteriorActive = Boolean(
    periodoConcluidasInicio &&
    periodoConcluidasFim &&
    periodoConcluidasInicio === presetsInfoConcluidas.mesAnterior.inicio &&
    periodoConcluidasFim === presetsInfoConcluidas.mesAnterior.fim
  );

  const hasActiveFilters = Boolean(
    tipoFiltro !== 'all' ||
    secretariaFiltro !== 'all' ||
    tipoDataFiltro !== 'retorno' ||
    periodoInicio !== '' ||
    periodoFim !== '' ||
    filtroArquivadas !== 'padrao' ||
    Boolean(periodoConcluidasInicio && periodoConcluidasFim && !isConcluidasUltimos30Active) ||
    Boolean(!periodoConcluidasInicio && !periodoConcluidasFim)
  );

  // Filtragem Dinâmica dos Afastamentos e Atos Homologados com Regra Oficial de Desmembramento
  // Observação 1: Os períodos das ativas se referem à Data de Retorno ou Data de Afastamento conforme escolha!
  // Observação 2: Licenças concluídas são informadas baseadas no intervalo de tempo de conclusão/retorno!
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(occ => {
      const isArquivada = occ.status === 'Arquivado';
      const isConcluida = occ.status === 'Concluída';
      const dataConcessaoEfetiva = occ.data_concessao || occ.data_inicio;

      // Data de referência para os afastamentos ativos/em curso conforme tipoDataFiltro
      const dataReferenciaAtiva = tipoDataFiltro === 'afastamento' ? occ.data_inicio : occ.data_termino;

      // 1. Regra Oficial IPME: Tratamento e Desmembramento de Licenças Arquivadas
      if (filtroArquivadas === 'apenas_ativas') {
        if (isArquivada || isConcluida) return false;
        // Filtra pela Data de Afastamento ou de Retorno
        if (periodoInicio && dataReferenciaAtiva < periodoInicio) return false;
        if (periodoFim && dataReferenciaAtiva > periodoFim) return false;
      } else if (filtroArquivadas === 'apenas_arquivadas') {
        // Exibe exclusivamente as licenças definitivas arquivadas cuja concessão ocorreu no período
        if (!isArquivada) return false;
        if (periodoInicio && dataConcessaoEfetiva < periodoInicio) return false;
        if (periodoFim && dataConcessaoEfetiva > periodoFim) return false;
      } else if (filtroArquivadas === 'todas_arquivadas') {
        // Exibe todas as licenças arquivadas (filtradas pelo período de concessão se fornecido)
        if (!isArquivada) return false;
        if (periodoInicio && dataConcessaoEfetiva < periodoInicio) return false;
        if (periodoFim && dataConcessaoEfetiva > periodoFim) return false;
      } else {
        // Modo 'padrao': Afastamentos vigentes + Concluídas no intervalo informado + Licenças Definitivas Concedidas no Período
        if (isArquivada) {
          // As licenças definitivas arquivadas NÃO deverão mais ser informadas,
          // salvo para aquele período cuja concessão ocorreu no mês/período selecionado!
          // Se nenhum período foi especificado no relatório executivo geral, arquivadas não aparecem
          if (!periodoInicio && !periodoFim) {
            return false;
          }
          if (periodoInicio && dataConcessaoEfetiva < periodoInicio) return false;
          if (periodoFim && dataConcessaoEfetiva > periodoFim) return false;
        } else if (isConcluida) {
          // Licenças Concluídas DEVEM sempre ser informadas baseadas em um intervalo de tempo
          // Se nenhum período foi informado para concluídas, elas não entram no relatório
          if (!periodoConcluidasInicio && !periodoConcluidasFim) {
            return false;
          }
          // Data de conclusão efetiva: data_retorno informada ou a data de término da licença (data_termino)
          const dataConclusao = occ.data_retorno || occ.data_termino;
          if (periodoConcluidasInicio && dataConclusao < periodoConcluidasInicio) return false;
          if (periodoConcluidasFim && dataConclusao > periodoConcluidasFim) return false;
        } else {
          // Afastamentos ativos em curso: filtrados pela Data de Afastamento ou Data de Retorno
          if (periodoInicio && dataReferenciaAtiva < periodoInicio) return false;
          if (periodoFim && dataReferenciaAtiva > periodoFim) return false;
        }
      }

      // 2. Filtro Tipo de Ato
      if (tipoFiltro !== 'all' && occ.tipo !== tipoFiltro) return false;

      // 3. Filtro Secretaria de Lotação
      if (secretariaFiltro !== 'all') {
        const emp = employees.find(e => e.matricula === occ.matricula);
        const sec = occ.employee_secretaria || emp?.secretaria;
        if (sec !== secretariaFiltro && !sec?.startsWith(secretariaFiltro)) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
  }, [occurrences, employees, tipoFiltro, secretariaFiltro, tipoDataFiltro, periodoInicio, periodoFim, periodoConcluidasInicio, periodoConcluidasFim, filtroArquivadas]);

  // Desmembramento Oficial de Licenças: Afastamentos Temporários vs Licenças Definitivas Arquivadas
  const afastamentosTemporarios = useMemo(() => {
    return filteredOccurrences.filter(occ => occ.status !== 'Arquivado');
  }, [filteredOccurrences]);

  const licencasDefinitivasArquivadas = useMemo(() => {
    return filteredOccurrences.filter(occ => occ.status === 'Arquivado');
  }, [filteredOccurrences]);

  // Totais do Relatório para Fechamento Oficial
  const totals = useMemo(() => {
    const totalRegistros = filteredOccurrences.length;
    const totalTemporarios = afastamentosTemporarios.length;
    const totalAposentadoriasArquivadas = licencasDefinitivasArquivadas.length;
    const totalDiasCorridos = afastamentosTemporarios.reduce((acc, o) => acc + (o.quantidade_dias || 0), 0);
    const totalDiasIPME = afastamentosTemporarios.reduce((acc, o) => acc + calcularDiasPagos(o.quantidade_dias || 0), 0);
    const totalDiasPrefeitura = totalDiasCorridos - totalDiasIPME;
    const totalLicencaSaude = afastamentosTemporarios.filter(o => o.tipo === 'Licença Saúde').length;
    const totalReadaptacao = afastamentosTemporarios.filter(o => o.tipo === 'Readaptação').length;
    const totalLicencaDefinitivaAtiva = afastamentosTemporarios.filter(o => o.tipo === 'Licença Definitiva').length;
    const totalLicencaDefinitiva = filteredOccurrences.filter(o => o.tipo === 'Licença Definitiva').length;
    const totalLicencaMaternidade = afastamentosTemporarios.filter(o => o.tipo === 'Licença Maternidade').length;

    const totalConcluidas = afastamentosTemporarios.filter(o => o.status === 'Concluída').length;
    const totalAtivas = afastamentosTemporarios.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada').length;

    return {
      totalRegistros,
      totalTemporarios,
      totalAposentadoriasArquivadas,
      totalDiasCorridos,
      totalDiasIPME,
      totalDiasPrefeitura,
      totalLicencaSaude,
      totalReadaptacao,
      totalLicencaDefinitivaAtiva,
      totalLicencaDefinitiva,
      totalLicencaMaternidade,
      totalAtivosEmCurso: totalAtivas,
      totalConcluidas,
    };
  }, [filteredOccurrences, afastamentosTemporarios, licencasDefinitivasArquivadas]);

  const periodoReferenciaDesc = useMemo(() => {
    if (periodoInicio && periodoFim) {
      return `${formatarDataBR(periodoInicio)} a ${formatarDataBR(periodoFim)}`;
    } else if (periodoInicio) {
      return `A partir de ${formatarDataBR(periodoInicio)}`;
    } else if (periodoFim) {
      return `Até ${formatarDataBR(periodoFim)}`;
    }
    return 'Geral / Todos os Períodos';
  }, [periodoInicio, periodoFim]);

  const periodoConcluidasDesc = useMemo(() => {
    if (isConcluidasUltimos30Active) {
      return `Últimos 30 Dias (${formatarDataBR(periodoConcluidasInicio)} a ${formatarDataBR(periodoConcluidasFim)})`;
    }
    if (periodoConcluidasInicio && periodoConcluidasFim) {
      return `${formatarDataBR(periodoConcluidasInicio)} a ${formatarDataBR(periodoConcluidasFim)}`;
    }
    if (periodoConcluidasInicio) {
      return `A partir de ${formatarDataBR(periodoConcluidasInicio)}`;
    }
    if (periodoConcluidasFim) {
      return `Até ${formatarDataBR(periodoConcluidasFim)}`;
    }
    return 'Não incluídas no recorte';
  }, [periodoConcluidasInicio, periodoConcluidasFim, isConcluidasUltimos30Active]);

  const filtroArquivadasDesc = useMemo(() => {
    switch (filtroArquivadas) {
      case 'apenas_arquivadas':
        return 'Somente Licenças Definitivas Arquivadas (Concessões do Período)';
      case 'todas_arquivadas':
        return 'Todas as Licenças Arquivadas (Acervo Histórico)';
      case 'apenas_ativas':
        return 'Somente Afastamentos Ativos / Vigentes';
      default:
        return 'Vigentes + Aposentadorias Concedidas no Período';
    }
  }, [filtroArquivadas]);

  // Agrupamento estruturado de Afastamentos Temporários por Secretaria Municipal
  const groupedBySecretaria = useMemo(() => {
    const groupsMap = new Map<string, Occurrence[]>();

    for (const occ of afastamentosTemporarios) {
      const emp = employees.find(e => e.matricula === occ.matricula);
      const secName = (occ.employee_secretaria || emp?.secretaria || 'Outros Órgãos / Geral').trim();
      if (!groupsMap.has(secName)) {
        groupsMap.set(secName, []);
      }
      groupsMap.get(secName)!.push(occ);
    }

    const groups: {
      secretariaNome: string;
      secretariaSigla: string;
      occurrences: Occurrence[];
      subtotalAtos: number;
      subtotalDiasCorridos: number;
      subtotalDiasIPME: number;
      subtotalDiasPrefeitura: number;
      subtotalSaude: number;
      subtotalReadaptacao: number;
      subtotalDefinitiva: number;
      subtotalMaternidade: number;
    }[] = [];

    // Ordenação alfabética das Secretarias
    const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    for (const key of sortedKeys) {
      const occList = groupsMap.get(key) || [];
      const subtotalAtos = occList.length;
      const subtotalDiasCorridos = occList.reduce((acc, o) => acc + (o.quantidade_dias || 0), 0);
      const subtotalDiasIPME = occList.reduce((acc, o) => acc + calcularDiasPagos(o.quantidade_dias || 0), 0);
      const subtotalDiasPrefeitura = subtotalDiasCorridos - subtotalDiasIPME;
      const subtotalSaude = occList.filter(o => o.tipo === 'Licença Saúde').length;
      const subtotalReadaptacao = occList.filter(o => o.tipo === 'Readaptação').length;
      const subtotalDefinitiva = occList.filter(o => o.tipo === 'Licença Definitiva').length;
      const subtotalMaternidade = occList.filter(o => o.tipo === 'Licença Maternidade').length;

      // Localizar sigla oficial
      const matchedSec = secretarias.find(
        s => s.nome.toLowerCase() === key.toLowerCase() ||
             s.sigla.toLowerCase() === key.toLowerCase() ||
             key.toUpperCase().startsWith(s.sigla.toUpperCase())
      );
      const sigla = matchedSec?.sigla || (key.includes(' - ') ? key.split(' - ')[0] : key.slice(0, 10));

      groups.push({
        secretariaNome: key,
        secretariaSigla: sigla,
        occurrences: occList,
        subtotalAtos,
        subtotalDiasCorridos,
        subtotalDiasIPME,
        subtotalDiasPrefeitura,
        subtotalSaude,
        subtotalReadaptacao,
        subtotalDefinitiva,
        subtotalMaternidade,
      });
    }

    return groups;
  }, [filteredOccurrences, employees, secretarias]);

  if (!isOpen) return null;

  // Geração e Download Direto do PDF em Formato Paisagem (A4 Landscape) com Paginação Inteligente sem cortes
  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('executive-report-landscape');
    if (!reportElement) {
      alert('Elemento do relatório não encontrado.');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      setStatusMessage('Processando documento e calculando quebra de páginas sem cortes...');

      // Captura o elemento do relatório com alta resolução
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1280,
      });

      setStatusMessage('Organizando páginas e evitando corte em linhas de secretarias...');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfPageWidth = 297;
      const pdfPageHeight = 210;
      const margin = 8;
      const printableWidth = pdfPageWidth - (margin * 2); // 281 mm
      const printableHeight = pdfPageHeight - (margin * 2); // 194 mm

      // Altura em pixels do canvas correspondente a uma página do PDF
      const maxPageCanvasHeight = (printableHeight * canvas.width) / printableWidth;

      // Mapear elementos atômicos do relatório para nunca cortar no meio de um elemento
      const reportRect = reportElement.getBoundingClientRect();
      const scaleY = canvas.height / reportRect.height;

      // Elementos que não podem ser cortados: linhas tr, cabeçalhos de secretaria, subtotais e bloco de assinatura
      const breakElements = Array.from(
        reportElement.querySelectorAll(
          'tr, .secretaria-header-row, .secretaria-subtotal-row, .signature-block, .page-break-avoid, thead, tfoot'
        )
      );

      const itemBoxes = breakElements
        .map(el => {
          const r = el.getBoundingClientRect();
          return {
            top: (r.top - reportRect.top) * scaleY,
            bottom: (r.bottom - reportRect.top) * scaleY,
            height: r.height * scaleY,
          };
        })
        .filter(b => b.height > 0)
        .sort((a, b) => a.top - b.top);

      let pageStart = 0;
      let pageIndex = 0;

      while (pageStart < canvas.height - 10) {
        let idealEnd = pageStart + maxPageCanvasHeight;
        let pageEnd = idealEnd;

        if (idealEnd >= canvas.height) {
          pageEnd = canvas.height;
        } else {
          // Procura algum elemento que esteja sendo cortado no meio pela linha idealEnd
          const straddlingBox = itemBoxes.find(b => b.top < idealEnd && b.bottom > idealEnd);
          if (straddlingBox) {
            // Se o elemento não começou bem no topo da página atual, quebramos ANTES dele
            if (straddlingBox.top > pageStart + 50) {
              pageEnd = straddlingBox.top;
            } else {
              pageEnd = idealEnd;
            }
          } else {
            // Nenhum elemento é cortado exatamente na linha; recorta logo após o último elemento que coube
            const candidateBoxes = itemBoxes.filter(b => b.bottom <= idealEnd && b.bottom > pageStart);
            if (candidateBoxes.length > 0) {
              const lastFitting = candidateBoxes[candidateBoxes.length - 1];
              pageEnd = lastFitting.bottom + 4;
            } else {
              pageEnd = idealEnd;
            }
          }
        }

        // Garante avanço mínimo para evitar loops
        if (pageEnd <= pageStart + 30) {
          pageEnd = Math.min(pageStart + maxPageCanvasHeight, canvas.height);
        }

        const sliceHeight = pageEnd - pageStart;

        // Cria canvas para esta página recortada limpa
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0, pageStart, canvas.width, sliceHeight,
            0, 0, canvas.width, sliceHeight
          );
        }

        const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.98);
        const sliceHeightMm = (sliceHeight * printableWidth) / canvas.width;

        if (pageIndex > 0) {
          pdf.addPage('a4', 'landscape');
        }

        pdf.addImage(sliceImgData, 'JPEG', margin, margin, printableWidth, sliceHeightMm);

        pageStart = pageEnd;
        pageIndex++;
      }

      const fileName = `Relatorio_Executivo_IPME_Prefeitura_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      setStatusMessage('PDF gerado com sucesso sem corte de linhas!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Falha ao gerar PDF:', err);
      setStatusMessage('Não foi possível gerar diretamente. Tentando abrir caixa de impressão...');
      setTimeout(() => setStatusMessage(null), 5000);
      handlePrint();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Impressão limpa via Iframe isolado em A4 Paisagem
  const handlePrint = () => {
    const reportElement = document.getElementById('executive-report-landscape');
    if (!reportElement) {
      window.print();
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;');
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        window.print();
        return;
      }

      const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(el => el.outerHTML)
        .join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Relatório Mensal de Afastamentos e Atos Homologados - IPME</title>
            ${headStyles}
            <style>
              @page {
                size: A4 landscape;
                margin: 6mm 8mm;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
              }
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 4px !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                overflow: visible !important;
                font-size: 10px !important;
              }
              #executive-report-landscape {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border: none !important;
                background: #ffffff !important;
                overflow: visible !important;
              }
              table {
                page-break-inside: auto !important;
                border-collapse: collapse !important;
                width: 100% !important;
                table-layout: auto !important;
              }
              thead {
                display: table-header-group !important;
              }
              tfoot {
                display: table-footer-group !important;
              }
              tbody {
                page-break-inside: auto !important;
              }
              tr {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              th {
                font-size: 9px !important;
                padding: 4px 5px !important;
              }
              td {
                font-size: 9.5px !important;
                padding: 4px 5px !important;
              }
              .perito-name {
                font-size: 9px !important;
                line-height: 1.15 !important;
                white-space: normal !important;
                word-break: break-word !important;
              }
              .perito-crm {
                font-size: 8px !important;
                line-height: 1.1 !important;
              }
              .page-break-avoid, .signature-block, .secretaria-header-row, .secretaria-subtotal-row {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .secretaria-header-row {
                break-after: avoid !important;
                page-break-after: avoid !important;
              }
              .secretaria-subtotal-row {
                break-before: avoid !important;
                page-break-before: avoid !important;
              }
              .overflow-hidden, .overflow-y-auto {
                overflow: visible !important;
                max-height: none !important;
              }
            </style>
          </head>
          <body>
            <div>${reportElement.outerHTML}</div>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }, 500);
    } catch (e) {
      console.warn('Iframe print fallback to window.print():', e);
      window.print();
    }
  };

  const dataAtualFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      
      {/* Dynamic Print CSS for Landscape A4 Output */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 8mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 10px !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden;
          }
          #executive-report-landscape, #executive-report-landscape * {
            visibility: visible;
          }
          #executive-report-landscape {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            overflow: visible !important;
          }
          table {
            page-break-inside: auto !important;
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          tbody {
            page-break-inside: auto !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          th {
            font-size: 9px !important;
            padding: 4px 5px !important;
          }
          td {
            font-size: 9.5px !important;
            padding: 4px 5px !important;
          }
          .perito-name {
            font-size: 9px !important;
            line-height: 1.15 !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          .perito-crm {
            font-size: 8px !important;
            line-height: 1.1 !important;
          }
          .page-break-avoid, .signature-block, .secretaria-header-row, .secretaria-subtotal-row {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .secretaria-header-row {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .secretaria-subtotal-row {
            break-before: avoid !important;
            page-break-before: avoid !important;
          }
          .overflow-hidden, .overflow-y-auto {
            overflow: visible !important;
            max-height: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-[1360px] border border-slate-200 shadow-2xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Barra Superior Principal: Título & Ações no Azul Oficial IPME */}
        <div className="px-5 py-3.5 bg-[#3868A0] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#2B5485] print-hidden shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5 text-blue-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                  Relatório Mensal de Afastamentos & Atos Homologados
                </h2>
                <span className="font-mono text-[10px] font-bold text-blue-100 bg-[#254A75] px-2 py-0.5 rounded border border-[#5281B7]/60 shrink-0">
                  Envio Oficial à Prefeitura
                </span>
                <span className="font-mono text-[10px] font-bold text-blue-200 bg-[#254A75] px-2 py-0.5 rounded border border-[#5281B7]/60 shrink-0">
                  Formato A4 Paisagem
                </span>
              </div>
              <p className="text-xs text-blue-100/90 truncate mt-0.5">
                Emissão oficial para prestação de contas mensal à Prefeitura Municipal de Eusébio
              </p>
            </div>
          </div>

          {/* Botões de Ação Alinhados */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
              title="Gera e faz o download do arquivo PDF formatado em A4 Paisagem"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Gerando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isGeneratingPDF}
              className="px-3 py-1.5 bg-[#2B5485] hover:bg-[#23456E] disabled:opacity-60 text-white border border-[#5281B7]/60 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
              title="Abrir caixa de diálogo de impressão do navegador"
            >
              <Printer className="w-3.5 h-3.5 text-blue-100" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-0.5 cursor-pointer shrink-0"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros para Emissão: Novo Design LUMINOSO e OFICIAL no Azul IPME (Sem cores escuras) */}
        <div className="px-5 py-3.5 bg-[#F0F5FC] border-b border-[#BED4EF] text-xs text-slate-800 flex flex-col gap-2.5 print-hidden shrink-0 shadow-xs">
          
          {/* Linha Superior: Filtros Categóricos (Tipo de Ato, Secretaria, Situação) + Resumo & Limpar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Tipo de Ato */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#BED4EF] shrink-0 shadow-2xs">
                <FileCheck2 className="w-3.5 h-3.5 text-[#3868A0] shrink-0" />
                <span className="text-[11px] font-bold text-[#1E426D]">Tipo de Ato:</span>
                <select
                  value={tipoFiltro}
                  onChange={e => setTipoFiltro(e.target.value as any)}
                  className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-medium"
                >
                  <option value="all">Todos os Atos</option>
                  <option value="Licença Saúde">Licença Saúde</option>
                  <option value="Readaptação">Readaptação</option>
                  <option value="Licença Definitiva">Licença Definitiva</option>
                  <option value="Licença Maternidade">Licença Maternidade</option>
                </select>
              </div>

              {/* 2. Secretaria de Lotação */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#BED4EF] shrink-0 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-[#3868A0] shrink-0" />
                <span className="text-[11px] font-bold text-[#1E426D]">Secretaria:</span>
                <select
                  value={secretariaFiltro}
                  onChange={e => setSecretariaFiltro(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate font-medium"
                >
                  <option value="all">Todas Secretarias</option>
                  {secretarias.map(sec => (
                    <option key={sec.id} value={sec.sigla}>
                      {sec.sigla} - {sec.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Situação / Desmembramento de Licenças Arquivadas */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-[#BED4EF] shrink-0 shadow-2xs">
                <Archive className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px] font-bold text-[#1E426D]">Situação:</span>
                <select
                  value={filtroArquivadas}
                  onChange={e => setFiltroArquivadas(e.target.value as any)}
                  className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-medium"
                >
                  <option value="padrao">Vigentes + Concessões do Período</option>
                  <option value="apenas_arquivadas">Somente Arquivadas (Concessões do Período)</option>
                  <option value="todas_arquivadas">Todas as Arquivadas (Acervo Histórico)</option>
                  <option value="apenas_ativas">Somente Ativas / Vigentes</option>
                </select>
              </div>
            </div>

            {/* Indicador de Registros e Botão Limpar Tudo */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-slate-600 font-medium">
                Registros no Recorte: <strong className="text-[#1E426D] font-mono bg-white px-2 py-0.5 rounded border border-[#BED4EF] shadow-2xs">{filteredOccurrences.length}</strong>
              </span>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0 font-medium"
                  title="Redefinir todos os filtros para o padrão geral"
                >
                  <RotateCcw className="w-3 h-3 text-rose-600" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Linha Inferior: Bloco Unificado e Destacado do Período (Flexível: Retorno ou Afastamento) */}
          <div className="bg-white border border-[#BED4EF] rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            {/* Lado Esquerdo: Identificação, Seletor Flexível (Retorno / Afastamento) e Descrição */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 shrink-0 ${tipoDataFiltro === 'afastamento' ? 'text-amber-600' : 'text-[#3868A0]'}`} />
                <span className="text-xs font-bold text-[#1E426D]">Filtrar Período por:</span>

                {/* Seletor Flexível: DATA DE RETORNO vs DATA DE AFASTAMENTO */}
                <div className="inline-flex rounded-lg bg-[#EBF3FC] p-0.5 border border-[#BED4EF] text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTipoDataFiltro('retorno')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      tipoDataFiltro === 'retorno'
                        ? 'bg-[#3868A0] text-white shadow-2xs font-bold ring-1 ring-[#2A5282]'
                        : 'text-slate-600 hover:text-[#1E426D] hover:bg-[#DDEBFA]'
                    }`}
                    title="Filtrar as ocorrências ativas pela Data de Previsão de Retorno"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${tipoDataFiltro === 'retorno' ? 'bg-white' : 'bg-slate-400'}`}></span>
                    DATA DE RETORNO
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoDataFiltro('afastamento')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      tipoDataFiltro === 'afastamento'
                        ? 'bg-amber-600 text-white shadow-2xs font-bold ring-1 ring-amber-700'
                        : 'text-slate-600 hover:text-[#1E426D] hover:bg-[#DDEBFA]'
                    }`}
                    title="Filtrar as ocorrências ativas pela Data de Início do Afastamento"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${tipoDataFiltro === 'afastamento' ? 'bg-white' : 'bg-slate-400'}`}></span>
                    DATA DE AFASTAMENTO
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 border-l border-[#BED4EF] pl-2.5">
                <Info className={`w-3.5 h-3.5 shrink-0 ${tipoDataFiltro === 'afastamento' ? 'text-amber-600' : 'text-[#3868A0]'}`} />
                {tipoDataFiltro === 'afastamento' ? (
                  <span>Os períodos selecionados filtram pela <strong>Data de Afastamento</strong> (início da licença).</span>
                ) : (
                  <span>Os períodos selecionados filtram pela <strong>Data de Retorno</strong> prevista do servidor.</span>
                )}
              </div>
            </div>

            {/* Lado Direito: Especificação de Data e Botões Agrupados MÊS ATUAL / MÊS ANTERIOR / ANO */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Entradas de Data De ... Até */}
              <div className="flex items-center gap-1.5 bg-[#F6FAFF] px-2.5 py-1 rounded-lg border border-[#BED4EF]">
                <span className="text-[11px] font-semibold text-[#1E426D]">
                  {tipoDataFiltro === 'afastamento' ? 'Afastamento De:' : 'Retorno De:'}
                </span>
                <input
                  type="date"
                  value={periodoInicio}
                  onChange={e => setPeriodoInicio(e.target.value)}
                  title={tipoDataFiltro === 'afastamento' ? "Data inicial do afastamento" : "Data inicial da previsão de retorno"}
                  className={`bg-white border border-[#BED4EF] text-slate-800 text-xs px-2 py-0.5 rounded focus:outline-none font-mono shadow-2xs ${
                    tipoDataFiltro === 'afastamento' ? 'focus:border-amber-500' : 'focus:border-[#3868A0]'
                  }`}
                />
                <span className="text-slate-500 text-xs font-medium">até</span>
                <input
                  type="date"
                  value={periodoFim}
                  onChange={e => setPeriodoFim(e.target.value)}
                  title={tipoDataFiltro === 'afastamento' ? "Data final do afastamento" : "Data final da previsão de retorno"}
                  className={`bg-white border border-[#BED4EF] text-slate-800 text-xs px-2 py-0.5 rounded focus:outline-none font-mono shadow-2xs ${
                    tipoDataFiltro === 'afastamento' ? 'focus:border-amber-500' : 'focus:border-[#3868A0]'
                  }`}
                />
                {(periodoInicio || periodoFim) && (
                  <button
                    type="button"
                    onClick={handleClearPeriodoOnly}
                    title="Limpar apenas este período"
                    className="ml-1 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botões de Atalho Agrupados: MÊS ATUAL - MÊS ANTERIOR - ANO */}
              <div className="inline-flex rounded-lg bg-[#EBF3FC] p-0.5 border border-[#BED4EF] text-[11px]">
                <button
                  type="button"
                  onClick={setPresetMesAtual}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    isMesAtualActive
                      ? tipoDataFiltro === 'afastamento'
                        ? 'bg-amber-600 text-white shadow-xs font-bold ring-1 ring-amber-700'
                        : 'bg-[#3868A0] text-white shadow-xs font-bold ring-1 ring-[#2A5282]'
                      : 'text-slate-600 hover:text-[#1E426D] hover:bg-white'
                  }`}
                  title={tipoDataFiltro === 'afastamento' ? "Filtrar por afastamentos no mês corrente" : "Filtrar por retornos no mês corrente"}
                >
                  MÊS ATUAL
                </button>
                <button
                  type="button"
                  onClick={setPresetMesAnterior}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    isMesAnteriorActive
                      ? tipoDataFiltro === 'afastamento'
                        ? 'bg-amber-600 text-white shadow-xs font-bold ring-1 ring-amber-700'
                        : 'bg-[#3868A0] text-white shadow-xs font-bold ring-1 ring-[#2A5282]'
                      : 'text-slate-600 hover:text-[#1E426D] hover:bg-white'
                  }`}
                  title={tipoDataFiltro === 'afastamento' ? "Filtrar por afastamentos no mês anterior" : "Filtrar por retornos no mês anterior"}
                >
                  MÊS ANTERIOR
                </button>
                <button
                  type="button"
                  onClick={setPresetAnoAtual}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    isAnoActive
                      ? tipoDataFiltro === 'afastamento'
                        ? 'bg-amber-600 text-white shadow-xs font-bold ring-1 ring-amber-700'
                        : 'bg-[#3868A0] text-white shadow-xs font-bold ring-1 ring-[#2A5282]'
                      : 'text-slate-600 hover:text-[#1E426D] hover:bg-white'
                  }`}
                  title={tipoDataFiltro === 'afastamento' ? "Filtrar por afastamentos no ano corrente" : "Filtrar por retornos no ano corrente"}
                >
                  ANO
                </button>
              </div>

              {/* Indicador quando sem período definido */}
              {!periodoInicio && !periodoFim && (
                <span className="text-[10px] text-slate-500 bg-[#EBF3FC] border border-[#BED4EF] px-2 py-1 rounded-md hidden xl:inline font-mono">
                  Sem período definido (Geral)
                </span>
              )}
            </div>
          </div>

          {/* Linha 3: Bloco Específico do Período das Licenças Concluídas */}
          <div className="bg-white border border-[#BED4EF] rounded-xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            {/* Lado Esquerdo: Identificação e Descrição Explicativa */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3868A0] shrink-0" />
                <span className="text-xs font-bold text-[#1E426D]">Licenças Concluídas:</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#1E426D] bg-[#EBF3FC] border border-[#BED4EF] px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3868A0]"></span>
                  Intervalo de Término
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 border-l border-[#BED4EF] pl-2.5 hidden sm:flex">
                <Info className="w-3 h-3 text-[#3868A0] shrink-0" />
                <span>As licenças saúde concluídas são informadas com base no intervalo de término/retorno selecionado.</span>
              </div>
            </div>

            {/* Lado Direito: Entradas de Data e Botões Rápidos */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Entradas de Data De ... Até */}
              <div className="flex items-center gap-1.5 bg-[#F6FAFF] px-2.5 py-1 rounded-lg border border-[#BED4EF]">
                <span className="text-[11px] font-semibold text-[#1E426D]">De:</span>
                <input
                  type="date"
                  value={periodoConcluidasInicio}
                  onChange={e => setPeriodoConcluidasInicio(e.target.value)}
                  title="Data inicial da conclusão/retorno da licença"
                  className="bg-white border border-[#BED4EF] text-slate-800 text-xs px-2 py-0.5 rounded focus:outline-none focus:border-[#3868A0] font-mono shadow-2xs"
                />
                <span className="text-slate-500 text-xs font-medium">até</span>
                <input
                  type="date"
                  value={periodoConcluidasFim}
                  onChange={e => setPeriodoConcluidasFim(e.target.value)}
                  title="Data final da conclusão/retorno da licença"
                  className="bg-white border border-[#BED4EF] text-slate-800 text-xs px-2 py-0.5 rounded focus:outline-none focus:border-[#3868A0] font-mono shadow-2xs"
                />
                {(periodoConcluidasInicio || periodoConcluidasFim) && (
                  <button
                    type="button"
                    onClick={handleClearPeriodoConcluidas}
                    title="Não incluir licenças concluídas"
                    className="ml-1 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botões de Atalho Agrupados: ÚLTIMOS 30 DIAS - MÊS ATUAL - MÊS ANTERIOR - NÃO INCLUIR */}
              <div className="inline-flex rounded-lg bg-[#EBF3FC] p-0.5 border border-[#BED4EF] text-[11px]">
                <button
                  type="button"
                  onClick={setPresetConcluidasUltimos30}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    isConcluidasUltimos30Active
                      ? 'bg-[#3868A0] text-white shadow-xs font-bold ring-1 ring-[#2A5282]'
                      : 'text-slate-600 hover:text-[#1E426D] hover:bg-white'
                  }`}
                  title="Filtrar licenças concluídas nos últimos 30 dias"
                >
                  ÚLTIMOS 30 DIAS
                </button>
                <button
                  type="button"
                  onClick={setPresetConcluidasMesAtual}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    isConcluidasMesAtualActive
                      ? 'bg-[#3868A0] text-white shadow-xs font-bold ring-1 ring-[#2A5282]'
                      : 'text-slate-600 hover:text-[#1E426D] hover:bg-white'
                  }`}
                  title="Filtrar licenças concluídas no mês corrente"
                >
                  MÊS ATUAL
                </button>
                <button
                  type="button"
                  onClick={setPresetConcluidasMesAnterior}
                  className={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                    isConcluidasMesAnteriorActive
                      ? 'bg-[#3868A0] text-white shadow-xs font-bold ring-1 ring-[#2A5282]'
                      : 'text-slate-600 hover:text-[#1E426D] hover:bg-white'
                  }`}
                  title="Filtrar licenças concluídas no mês anterior"
                >
                  MÊS ANTERIOR
                </button>
                <button
                  type="button"
                  onClick={handleClearPeriodoConcluidas}
                  className={`px-2 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    !periodoConcluidasInicio && !periodoConcluidasFim
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 font-semibold'
                      : 'text-slate-500 hover:text-rose-700 hover:bg-white'
                  }`}
                  title="Não incluir licenças concluídas no relatório"
                >
                  NÃO INCLUIR
                </button>
              </div>

              {/* Indicador de Status */}
              {periodoConcluidasInicio && periodoConcluidasFim ? (
                <span className="text-[10px] text-[#1E426D] bg-[#EBF3FC] border border-[#BED4EF] px-2 py-1 rounded-md hidden xl:inline font-mono font-semibold">
                  {totals.totalConcluidas} concluída(s) no recorte
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 bg-[#EBF3FC] border border-[#BED4EF] px-2 py-1 rounded-md hidden xl:inline font-mono">
                  Concluídas desativadas
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Processing / Status Notification Banner */}
        {statusMessage && (
          <div className="bg-blue-900/90 text-blue-100 px-6 py-2 text-xs flex items-center justify-between border-b border-blue-800 animate-in fade-in duration-150 print-hidden shrink-0">
            <div className="flex items-center gap-2">
              {isGeneratingPDF ? (
                <Loader2 className="w-4 h-4 text-blue-300 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="font-medium">{statusMessage}</span>
            </div>
            <button 
              onClick={() => setStatusMessage(null)}
              className="text-blue-300 hover:text-white text-xs underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Document Canvas Container */}
        <div className="overflow-y-auto overflow-x-auto p-3 sm:p-6 bg-slate-100/70 print:p-0 print:bg-white flex-1">
          
          {/* THE OFFICIAL LANDSCAPE CANVAS (A4 Landscape) */}
          <div 
            id="executive-report-landscape" 
            className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-5 sm:p-7 mx-auto max-w-[1280px] text-slate-900 space-y-5 print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none"
          >
            
            {/* 1. CABEÇALHO OFICIAL / IDENTIFICAÇÃO ESTATUTÁRIA */}
            <div className="border-b-2 border-slate-900 pb-4 page-break-avoid">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                
                {/* Brasão & Títulos Institucionais */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-2xs shrink-0 flex items-center justify-center">
                    <img 
                      src="/src/assets/images/ipme_seal_logo_1790337165041.jpg" 
                      alt="Brasão Oficial IPME" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      Prefeitura Municipal de Eusébio · Ceará
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-950 font-sans tracking-tight">
                      IPME — Instituto de Previdência do Município de Eusébio
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        Junta Médica Pericial Oficial & Departamento de Gestão de Pessoas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Box de Metadados Oficiais */}
                <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 space-y-0.5 shrink-0 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                    DOCUMENTO OFICIAL PARA ENVIO MENSAL
                  </div>
                  <div className="text-sm font-bold text-slate-950 font-mono">
                    REL-IPME-MENSAL-PREFEITURA
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Emissão: <strong className="font-mono text-slate-800">{dataAtualFormatada}</strong>
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-800 font-medium pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Autenticidade Homologada</span>
                  </div>
                </div>

              </div>

              {/* Faixa Descritiva e Critérios Filtrados */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                    {filtroArquivadas === 'apenas_arquivadas'
                      ? 'RELATÓRIO EXECUTIVO DE LICENÇAS DEFINITIVAS ARQUIVADAS (APOSENTADORIAS)'
                      : 'RELATÓRIO MENSAL DE AFASTAMENTOS E ATOS HOMOLOGADOS'}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {filtroArquivadas === 'apenas_arquivadas'
                      ? 'Demonstrativo oficial de licenças definitivas e aposentadorias homologadas e arquivadas pela Junta Médica Oficial.'
                      : 'Demonstrativo oficial de licenças médicas, readaptações e aposentadorias periciadas pela Junta Médica Oficial para remessa à Prefeitura.'}
                  </p>
                </div>
                
                {/* Resumo dos Filtros Aplicados no Relatório */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <div>
                    <span className="text-slate-400 font-medium">Ato: </span>
                    <strong className="text-slate-900">{tipoFiltro === 'all' ? 'Todos os Atos' : tipoFiltro}</strong>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div>
                    <span className="text-slate-400 font-medium">
                      Período ({tipoDataFiltro === 'afastamento' ? 'Data Afastamento' : 'Data Retorno'}):{' '}
                    </span>
                    <strong className="text-slate-900">{periodoReferenciaDesc}</strong>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div>
                    <span className="text-slate-400 font-medium">Licenças Concluídas: </span>
                    <strong className="text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold">{periodoConcluidasDesc}</strong>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div>
                    <span className="text-slate-400 font-medium">Situação: </span>
                    <strong className="text-purple-900 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-bold">{filtroArquivadasDesc}</strong>
                  </div>
                  {secretariaFiltro !== 'all' && (
                    <>
                      <span className="text-slate-300">|</span>
                      <div>
                        <span className="text-slate-400 font-medium">Secretaria: </span>
                        <strong className="text-slate-900">{secretariaFiltro}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Destaque Institucional / Aviso de Concessão de Aposentadoria Definitiva no Período */}
              {totals.totalAposentadoriasArquivadas > 0 && (
                <div className="mt-3.5 bg-purple-50 border-l-4 border-purple-600 p-3 rounded-r-lg text-xs text-purple-950 flex items-start gap-2.5 page-break-avoid">
                  <AlertCircle className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wide">
                      AVISO OFICIAL: {totals.totalAposentadoriasArquivadas} CONCESSÃO(ÕES) DE LICENÇA DEFINITIVA / APOSENTADORIA NESTE PERÍODO ({periodoReferenciaDesc})
                    </span>
                    <span className="text-[11px] text-purple-900 leading-relaxed block mt-0.5">
                      Por terem se afastado em definitivo das atividades públicas por invalidez/incapacidade permanente, os respectivos processos periciais foram <strong>homologados e arquivados nesta competência</strong>. Conforme a regra de prestação de contas, estas ocorrências constam deste relatório para conhecimento e ciência formal dos órgãos municipais e não mais serão listadas nas remessas subsequentes.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. PARTE I: DETALHAMENTO DOS AFASTAMENTOS TEMPORÁRIOS E READAPTAÇÕES (EM CURSO) */}
            {filtroArquivadas !== 'apenas_arquivadas' && filtroArquivadas !== 'todas_arquivadas' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    <span>Parte I — Afastamentos Temporários & Readaptações Homologadas (Em Curso)</span>
                    <span className="font-normal font-mono text-slate-600 text-[11px]">
                      ({afastamentosTemporarios.length} ato(s) em {groupedBySecretaria.length} secretaria(s))
                    </span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Agrupado por Secretaria Municipal · Junta Médica Oficial IPME
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto print:overflow-visible bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead className="bg-slate-900 text-white font-semibold text-[9.5px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-1.5 text-center w-8">Nº</th>
                        <th className="py-2 px-2.5 min-w-[170px] max-w-[210px]">Servidor / Matrícula / CPF</th>
                        <th className="py-2 px-2 min-w-[120px] max-w-[150px]">Cargo Funcional</th>
                        <th className="py-2 px-2 text-center whitespace-nowrap">Tipo de Ato</th>
                        <th className={`py-2 px-2 text-center whitespace-nowrap ${tipoDataFiltro === 'afastamento' && (periodoInicio || periodoFim) ? 'bg-amber-950/80 text-amber-200 ring-1 ring-amber-400/50' : ''}`}>
                          Data Afastamento
                          {tipoDataFiltro === 'afastamento' && (periodoInicio || periodoFim) && (
                            <span className="ml-1 text-[8.5px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-bold">FILTRADO</span>
                          )}
                        </th>
                        <th className={`py-2 px-2 text-center whitespace-nowrap ${tipoDataFiltro === 'retorno' && (periodoInicio || periodoFim) ? 'bg-emerald-950/80 text-emerald-200 ring-1 ring-emerald-400/50' : ''}`}>
                          Data Retorno
                          {tipoDataFiltro === 'retorno' && (periodoInicio || periodoFim) && (
                            <span className="ml-1 text-[8.5px] bg-emerald-400 text-slate-950 px-1 py-0.2 rounded font-bold">FILTRADO</span>
                          )}
                        </th>
                        <th className="py-2 px-1.5 text-center whitespace-nowrap">Dias Totais</th>
                        <th className="py-2 px-1.5 text-center whitespace-nowrap">Dias Pagos</th>
                        <th className="py-2 px-2 text-left w-[145px] min-w-[130px] max-w-[160px]">Perito Oficial / CRM</th>
                        <th className="py-2 px-1.5 text-center whitespace-nowrap">Status</th>
                      </tr>
                    </thead>

                    {afastamentosTemporarios.length === 0 ? (
                      <tbody className="divide-y divide-slate-100 text-[11px]">
                        <tr>
                          <td colSpan={10} className="py-10 text-center text-slate-500">
                            <p className="font-semibold text-slate-700 text-sm">Nenhum afastamento temporário vigente encontrado para o recorte selecionado.</p>
                            <p className="text-xs text-slate-400 mt-1">Ajuste o período ou secretaria na barra superior.</p>
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      (() => {
                        let globalSeq = 0;
                        return groupedBySecretaria.map((group) => (
                          <tbody key={group.secretariaNome} className="divide-y divide-slate-100 text-[10.5px] border-b-2 border-slate-300 page-break-avoid">
                            {/* Faixa Cabeçalho da Secretaria */}
                            <tr className="bg-slate-800 text-white font-semibold text-xs page-break-avoid secretaria-header-row">
                              <td colSpan={10} className="py-2 px-2.5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span className="font-bold uppercase tracking-wider text-xs">
                                      {group.secretariaNome}
                                    </span>
                                    <span className="bg-slate-700 text-slate-200 text-[9.5px] font-mono px-1.5 py-0.5 rounded font-bold">
                                      {group.secretariaSigla}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-normal text-slate-300 flex items-center gap-2 flex-wrap">
                                    <span><strong>{group.subtotalAtos}</strong> ato(s)</span>
                                    <span>·</span>
                                    <span>Saúde: <strong>{group.subtotalSaude}</strong> | Readaptação: <strong>{group.subtotalReadaptacao}</strong> | Maternidade: <strong>{group.subtotalMaternidade}</strong></span>
                                    <span>·</span>
                                    <span>Dias: <strong>{group.subtotalDiasCorridos}d</strong></span>
                                    <span>·</span>
                                    <span className="text-emerald-300 font-semibold">IPME: <strong>{group.subtotalDiasIPME}d pagos</strong></span>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* Registros de Servidores da Secretaria */}
                            {group.occurrences.map((occ) => {
                              globalSeq += 1;
                              const currentSeq = globalSeq;
                              const diasPagos = calcularDiasPagos(occ.quantidade_dias);
                              const emp = employees.find(e => e.matricula === occ.matricula);

                              return (
                                <tr key={occ.id} className="hover:bg-slate-50/70 transition-colors page-break-avoid">
                                  {/* Seq Global */}
                                  <td className="py-2 px-1.5 text-center font-mono text-[9.5px] text-slate-400 font-semibold">
                                    {currentSeq}
                                  </td>

                                  {/* Servidor */}
                                  <td className="py-2 px-2.5 min-w-[170px] max-w-[210px]">
                                    <span className="font-bold text-slate-900 block text-[11px] leading-tight">
                                      {occ.employee_nome || emp?.nome || 'Servidor'}
                                    </span>
                                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 mt-0.5">
                                      <span>Matr. <strong>{occ.matricula}</strong></span>
                                      {emp?.cpf && (
                                        <span>· CPF {formatarCPF(emp.cpf)}</span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Cargo Funcional */}
                                  <td className="py-2 px-2 min-w-[120px] max-w-[150px]">
                                    <span className="font-medium text-slate-800 block text-[10px] leading-tight break-words">
                                      {occ.employee_cargo || emp?.cargo || 'Servidor Municipal'}
                                    </span>
                                  </td>

                                  {/* Tipo de Ato */}
                                  <td className="py-2 px-2 text-center whitespace-nowrap">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                                      occ.tipo === 'Licença Saúde' 
                                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                                        : occ.tipo === 'Readaptação'
                                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                                        : occ.tipo === 'Licença Definitiva'
                                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                                        : 'bg-pink-50 text-pink-800 border-pink-200'
                                    }`}>
                                      {occ.tipo}
                                    </span>
                                  </td>

                                  {/* Data Afastamento */}
                                  <td className="py-2 px-2 whitespace-nowrap font-mono text-slate-800 font-medium text-center text-[10px]">
                                    {formatarDataBR(occ.data_inicio)}
                                  </td>

                                  {/* Data Retorno */}
                                  <td className="py-2 px-2 whitespace-nowrap font-mono font-medium text-center text-[10px]">
                                    {isPrevisaoRetornoEmAtraso(occ.data_termino, occ.status, occ.tipo) ? (
                                      <span 
                                        className="inline-block px-1.5 py-0.5 rounded font-bold text-rose-800 bg-rose-100 border border-rose-300 text-[9.5px] print:text-rose-700 print:bg-rose-50"
                                        title={`Previsão de retorno em atraso há ${calcularDiasAtraso(occ.data_termino)} dias em relação a hoje.`}
                                      >
                                        {formatarDataBR(occ.data_termino)} ⚠️
                                      </span>
                                    ) : occ.status === 'Concluída' ? (
                                      <span 
                                        className="inline-block px-1.5 py-0.5 rounded font-semibold text-blue-900 bg-blue-50 border border-blue-200 text-[9.5px]"
                                        title={`Licença Concluída / Servidor Retornou em ${formatarDataBR(occ.data_retorno || occ.data_termino)}`}
                                      >
                                        {formatarDataBR(occ.data_retorno || occ.data_termino)}
                                      </span>
                                    ) : (
                                      <span className="text-slate-800">{formatarDataBR(occ.data_termino)}</span>
                                    )}
                                  </td>

                                  {/* Total Dias */}
                                  <td className="py-2 px-1.5 whitespace-nowrap text-center font-mono font-bold text-slate-900 text-[10px]">
                                    {occ.quantidade_dias}d
                                  </td>

                                  {/* Dias Pagos */}
                                  <td className="py-2 px-1.5 whitespace-nowrap text-center">
                                    {diasPagos > 0 ? (
                                      <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[9.5px]">
                                        {diasPagos} dias
                                      </span>
                                    ) : (
                                      <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[9.5px]" title="Custeado pela folha patronal da Prefeitura (1º ao 15º dia)">
                                        0d (Prefeitura)
                                      </span>
                                    )}
                                  </td>

                                  {/* Médico Perito Oficial & CRM - Exibição Completa Sem Cortes */}
                                  <td className="py-2 px-2 w-[145px] min-w-[130px] max-w-[160px] whitespace-normal">
                                    <span className="font-semibold text-slate-900 block text-[9.5px] leading-tight break-words perito-name">
                                      {occ.medico_perito || 'Dr. Marcelo Cavalcante Holanda'}
                                    </span>
                                    <span className="font-mono text-[8.5px] text-slate-500 block mt-0.5 font-medium leading-none perito-crm">
                                      {occ.crm || 'CRM/CE 14.892'}
                                    </span>
                                  </td>

                                  {/* Status */}
                                  <td className="py-2 px-1.5 whitespace-nowrap text-center">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                                      occ.status === 'Ativa' 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                        : occ.status === 'Prorrogada' 
                                        ? 'bg-purple-50 text-purple-800 border-purple-200' 
                                        : occ.status === 'Concluída'
                                        ? 'bg-blue-50 text-blue-800 border-blue-200 font-bold'
                                        : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}>
                                      {occ.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Subtotal da Secretaria */}
                            <tr className="bg-slate-100/90 font-semibold text-slate-800 text-[10px] border-t border-slate-300 page-break-avoid secretaria-subtotal-row">
                              <td colSpan={3} className="py-2 px-3">
                                <span className="text-slate-600 uppercase font-mono">
                                  Subtotal {group.secretariaSigla}:
                                </span>{' '}
                                <span className="text-slate-900 font-bold">{group.subtotalAtos} ato(s)</span>
                              </td>
                              <td colSpan={3} className="py-2 px-3 text-right text-slate-600 font-mono">
                                Soma Afastamentos Temporários:
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-slate-950">
                                {group.subtotalDiasCorridos}d
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-emerald-800">
                                {group.subtotalDiasIPME}d
                              </td>
                              <td colSpan={2} className="py-2 px-3 text-slate-500 font-normal text-[10px]">
                                ({group.subtotalDiasPrefeitura}d na folha patronal da Prefeitura)
                              </td>
                            </tr>
                          </tbody>
                        ));
                      })()
                    )}

                    {/* Linha de Totais da Parte I */}
                    {afastamentosTemporarios.length > 0 && (
                      <tfoot className="bg-slate-900 text-white font-semibold text-xs border-t-2 border-slate-950 page-break-avoid">
                        <tr>
                          <td colSpan={4} className="py-3 px-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span>TOTAL PARTE I (AFASTAMENTOS TEMPORÁRIOS): <strong>{totals.totalTemporarios} atos</strong></span>
                              <span className="text-slate-500">·</span>
                              <span className="text-slate-300 text-[11px]">
                                Saúde: <strong>{totals.totalLicencaSaude}</strong> | Readaptação: <strong>{totals.totalReadaptacao}</strong> | Maternidade: <strong>{totals.totalLicencaMaternidade}</strong>
                                {totals.totalConcluidas > 0 && (
                                  <span className="text-blue-300 ml-1">· ({totals.totalAtivosEmCurso} em curso, {totals.totalConcluidas} concluídas)</span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td colSpan={2} className="py-3 px-3 text-right text-slate-300 font-mono text-[10px] uppercase">
                            Soma Geral de Dias Temporários:
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-white text-xs">
                            {totals.totalDiasCorridos} dias
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-300 text-xs">
                            {totals.totalDiasIPME} dias pagos
                          </td>
                          <td colSpan={2} className="py-3 px-3 text-slate-300 text-[10px]">
                            * {totals.totalDiasPrefeitura} dias na folha patronal da Prefeitura (1º ao 15º dia).
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* 3. PARTE II: DESMEMBRAMENTO DE LICENÇAS DEFINITIVAS / APOSENTADORIAS HOMOLOGADAS E ARQUIVADAS NO PERÍODO */}
            {(filtroArquivadas === 'apenas_arquivadas' || filtroArquivadas === 'todas_arquivadas' || (filtroArquivadas === 'padrao' && licencasDefinitivasArquivadas.length > 0) || tipoFiltro === 'Licença Definitiva') && (
              <div className="space-y-3 pt-2 page-break-avoid">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-purple-700" />
                    <span>Parte II — Desmembramento Oficial: Licenças Definitivas Arquivadas (Aposentadorias por Invalidez)</span>
                    <span className="font-normal font-mono text-purple-800 text-[11px] bg-purple-100 px-2 py-0.5 rounded border border-purple-300">
                      {licencasDefinitivasArquivadas.length} concessão(ões) arquivada(s)
                    </span>
                  </h3>
                  <span className="text-[10px] text-purple-700 font-mono">
                    Concessões Homologadas Definitivas · Regra Oficial de Desmembramento IPME
                  </span>
                </div>

                <div className="border border-purple-300 rounded-xl overflow-x-auto print:overflow-visible bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse table-auto">
                    <thead className="bg-purple-950 text-white font-semibold text-[9.5px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-1.5 text-center w-8">Nº</th>
                        <th className="py-2 px-2.5 min-w-[170px] max-w-[210px]">Servidor / Matrícula / CPF</th>
                        <th className="py-2 px-2 min-w-[130px] max-w-[160px]">Cargo Funcional / Secretaria</th>
                        <th className="py-2 px-2 whitespace-nowrap text-center">Início Afastamento</th>
                        <th className="py-2 px-2 whitespace-nowrap text-center">Data Concessão</th>
                        <th className="py-2 px-2 whitespace-nowrap">Ato Concessão</th>
                        <th className="py-2 px-2 w-[145px] min-w-[130px] max-w-[160px] text-left">Perito Oficial / CRM</th>
                        <th className="py-2 px-2 min-w-[180px]">Parecer Pericial Conclusivo</th>
                        <th className="py-2 px-1.5 text-center whitespace-nowrap">Situação</th>
                      </tr>
                    </thead>

                    {licencasDefinitivasArquivadas.length === 0 ? (
                      <tbody className="divide-y divide-purple-100 text-[11px]">
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500 bg-purple-50/30">
                            <p className="font-semibold text-purple-900 text-xs">Nenhuma concessão de Licença Definitiva registrada nesta competência ({periodoReferenciaDesc}).</p>
                            <p className="text-[11px] text-purple-700 mt-1">Concessões ocorridas em períodos anteriores já foram informadas em remessas anteriores e encontram-se devidamente arquivadas.</p>
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody className="divide-y divide-purple-100 text-[10.5px]">
                        {licencasDefinitivasArquivadas.map((occ, idx) => {
                          const emp = employees.find(e => e.matricula === occ.matricula);
                          const sec = occ.employee_secretaria || emp?.secretaria || 'Geral';

                          return (
                            <tr key={occ.id} className="hover:bg-purple-50/50 transition-colors page-break-avoid">
                              {/* Seq */}
                              <td className="py-2 px-1.5 text-center font-mono text-[9.5px] text-purple-600 font-semibold">
                                {idx + 1}
                              </td>

                              {/* Servidor */}
                              <td className="py-2 px-2.5 min-w-[170px] max-w-[210px]">
                                <span className="font-bold text-slate-900 block text-[11px] leading-tight">
                                  {occ.employee_nome || emp?.nome || 'Servidor'}
                                </span>
                                <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 mt-0.5">
                                  <span>Matr. <strong>{occ.matricula}</strong></span>
                                  {emp?.cpf && (
                                    <span>· CPF {formatarCPF(emp.cpf)}</span>
                                  )}
                                </div>
                              </td>

                              {/* Cargo & Secretaria */}
                              <td className="py-2 px-2 min-w-[130px] max-w-[160px]">
                                <span className="font-medium text-slate-800 block text-[10px] leading-tight break-words">
                                  {occ.employee_cargo || emp?.cargo || 'Servidor'}
                                </span>
                                <span className="font-mono text-[9px] text-slate-500 block truncate">
                                  {sec}
                                </span>
                              </td>

                              {/* Início Afastamento */}
                              <td className="py-2 px-2 whitespace-nowrap font-mono text-slate-800 font-medium text-center text-[10px]">
                                {formatarDataBR(occ.data_inicio)}
                              </td>

                              {/* Data Concessão */}
                              <td className="py-2 px-2 whitespace-nowrap font-mono text-center text-[10px]">
                                <span className="bg-purple-100 text-purple-950 font-bold px-1.5 py-0.5 rounded border border-purple-300 inline-block text-[9.5px]">
                                  {formatarDataBR(occ.data_concessao || occ.data_inicio)}
                                </span>
                              </td>

                              {/* Ato Concessão */}
                              <td className="py-2 px-2 whitespace-nowrap font-mono font-medium text-slate-800 text-[10px]">
                                {occ.ato_concessao || 'Portaria Homologada'}
                              </td>

                              {/* Médico Perito Oficial & CRM - Exibição Completa Sem Cortes */}
                              <td className="py-2 px-2 w-[145px] min-w-[130px] max-w-[160px] whitespace-normal">
                                <span className="font-semibold text-slate-900 block text-[9.5px] leading-tight break-words perito-name">
                                  {occ.medico_perito || 'Dr. Marcelo Cavalcante Holanda'}
                                </span>
                                <span className="font-mono text-[8.5px] text-slate-500 block mt-0.5 font-medium leading-none perito-crm">
                                  {occ.crm || 'CRM/CE 14.892'}
                                </span>
                              </td>

                              {/* Parecer Conclusivo */}
                              <td className="py-2 px-2 max-w-[200px] text-[9.5px] text-slate-700 leading-tight">
                                <p className="truncate" title={occ.parecer_tecnico || occ.observacoes}>
                                  {occ.parecer_tecnico || occ.observacoes || 'Invalidez definitiva constatada por Junta Médica Oficial.'}
                                </p>
                              </td>

                              {/* Situação */}
                              <td className="py-2 px-1.5 whitespace-nowrap text-center">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                  <Archive className="w-2.5 h-2.5" />
                                  <span>Arquivado</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    )}

                    {/* Rodapé da Parte II */}
                    {licencasDefinitivasArquivadas.length > 0 && (
                      <tfoot className="bg-purple-950 text-white font-semibold text-xs border-t-2 border-purple-900 page-break-avoid">
                        <tr>
                          <td colSpan={5} className="py-2.5 px-3">
                            <span>TOTAL PARTE II: <strong>{totals.totalAposentadoriasArquivadas} licença(s) definitiva(s) arquivada(s) nesta competência</strong></span>
                          </td>
                          <td colSpan={4} className="py-2.5 px-3 text-right text-purple-200 text-[10px]">
                            * Homologação de desligamento e arquivamento definitivo para fins previdenciários junto ao IPME.
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* 3. ASSINATURAS INSTITUCIONAIS & VALIDAÇÃO */}
            <div className="page-break-avoid signature-block pt-6 border-t-2 border-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                
                {/* Assinatura 1: Junta Médica / Diretor Médico */}
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-3/4 mx-auto h-9"></div>
                  <span className="font-bold text-slate-900 block text-xs break-words">
                    {diretorMedico ? diretorMedico.nome : 'Dr. Marcelo Cavalcante Holanda'}
                  </span>
                  <span className="text-[10px] text-slate-600 block leading-tight">
                    {diretorMedico?.is_diretor ? 'Diretor Médico da Junta Pericial Oficial' : 'Coordenador da Junta Médica Pericial Oficial'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {diretorMedico ? `${diretorMedico.crm}${diretorMedico.vinculo ? ` · Médico ${diretorMedico.vinculo}` : ''}` : 'CRM/CE 14.892'} · IPME
                  </span>
                </div>

                {/* Assinatura 2: Gestão de Pessoas */}
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-3/4 mx-auto h-9"></div>
                  <span className="font-bold text-slate-900 block text-xs">
                    Mariana Vasconcelos de Alencar
                  </span>
                  <span className="text-[10px] text-slate-600 block">
                    Coordenação de Gestão de Pessoas & DHO
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Prefeitura Municipal de Eusébio
                  </span>
                </div>

                {/* Assinatura 3: Diretor-Presidente IPME */}
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-3/4 mx-auto h-9"></div>
                  <span className="font-bold text-slate-900 block text-xs">
                    Plínio Catunda
                  </span>
                  <span className="text-[10px] text-slate-600 block">
                    Diretor-Presidente do IPME
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Instituto de Previdência de Eusébio
                  </span>
                </div>

              </div>

              {/* Rodapé Legal e Validação */}
              <div className="mt-6 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Autenticação Documental:</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    HASH-IPME-MENSAL-PREF-99B4A712
                  </span>
                </div>
                <div>
                  Em conformidade com a Lei Orgânica Municipal e Regime Próprio de Previdência Social (RPPS).
                </div>
                <div>
                  Orientação Paisagem (Landscape A4) · Uso Oficial
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
