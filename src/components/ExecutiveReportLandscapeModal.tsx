import React, { useState, useMemo } from 'react';
import { Occurrence, Employee, Secretaria, DashboardMetrics, OccurrenceType, Doctor } from '../types/index.ts';
import { formatarDataBR, calcularDiasPagos, formatarCPF } from '../utils/validation.ts';
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
  Stethoscope
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
  // 1. Filtros para Emissão do Relatório
  const [tipoFiltro, setTipoFiltro] = useState<'all' | OccurrenceType>('all');
  const [secretariaFiltro, setSecretariaFiltro] = useState<string>('all');
  const [dataAfastamentoInicio, setDataAfastamentoInicio] = useState<string>('');
  const [dataAfastamentoFim, setDataAfastamentoFim] = useState<string>('');
  const [dataRetornoInicio, setDataRetornoInicio] = useState<string>('');
  const [dataRetornoFim, setDataRetornoFim] = useState<string>('');

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setTipoFiltro('all');
    setSecretariaFiltro('all');
    setDataAfastamentoInicio('');
    setDataAfastamentoFim('');
    setDataRetornoInicio('');
    setDataRetornoFim('');
  };

  // Presets rápidos para fechamento mensal
  const setPresetMesAtual = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    setDataAfastamentoInicio(`${year}-${month}-01`);
    setDataAfastamentoFim(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
  };

  const setPresetMesAnterior = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    setDataAfastamentoInicio(`${year}-${month}-01`);
    setDataAfastamentoFim(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
  };

  const hasActiveFilters = Boolean(
    tipoFiltro !== 'all' ||
    secretariaFiltro !== 'all' ||
    dataAfastamentoInicio ||
    dataAfastamentoFim ||
    dataRetornoInicio ||
    dataRetornoFim
  );

  // Filtragem Dinâmica dos Afastamentos e Atos Homologados
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(occ => {
      // 1. Filtro Tipo de Ato
      if (tipoFiltro !== 'all' && occ.tipo !== tipoFiltro) return false;

      // 2. Filtro Secretaria de Lotação
      if (secretariaFiltro !== 'all') {
        const emp = employees.find(e => e.matricula === occ.matricula);
        const sec = occ.employee_secretaria || emp?.secretaria;
        if (sec !== secretariaFiltro && !sec?.startsWith(secretariaFiltro)) return false;
      }

      // 3. Filtro Data de Afastamento (data_inicio)
      if (dataAfastamentoInicio && occ.data_inicio < dataAfastamentoInicio) return false;
      if (dataAfastamentoFim && occ.data_inicio > dataAfastamentoFim) return false;

      // 4. Filtro Data de Retorno (data_termino)
      if (dataRetornoInicio && occ.data_termino < dataRetornoInicio) return false;
      if (dataRetornoFim && occ.data_termino > dataRetornoFim) return false;

      return true;
    }).sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime());
  }, [occurrences, employees, tipoFiltro, secretariaFiltro, dataAfastamentoInicio, dataAfastamentoFim, dataRetornoInicio, dataRetornoFim]);

  // Totais do Relatório para Fechamento Oficial
  const totals = useMemo(() => {
    const totalRegistros = filteredOccurrences.length;
    const totalDiasCorridos = filteredOccurrences.reduce((acc, o) => acc + (o.quantidade_dias || 0), 0);
    const totalDiasIPME = filteredOccurrences.reduce((acc, o) => acc + calcularDiasPagos(o.quantidade_dias || 0), 0);
    const totalDiasPrefeitura = totalDiasCorridos - totalDiasIPME;
    const totalLicencaSaude = filteredOccurrences.filter(o => o.tipo === 'Licença Saúde').length;
    const totalReadaptacao = filteredOccurrences.filter(o => o.tipo === 'Readaptação').length;
    const totalLicencaDefinitiva = filteredOccurrences.filter(o => o.tipo === 'Licença Definitiva').length;
    const totalLicencaMaternidade = filteredOccurrences.filter(o => o.tipo === 'Licença Maternidade').length;

    return {
      totalRegistros,
      totalDiasCorridos,
      totalDiasIPME,
      totalDiasPrefeitura,
      totalLicencaSaude,
      totalReadaptacao,
      totalLicencaDefinitiva,
      totalLicencaMaternidade,
    };
  }, [filteredOccurrences]);

  const periodoAfastamentoDesc = useMemo(() => {
    if (dataAfastamentoInicio && dataAfastamentoFim) {
      return `${formatarDataBR(dataAfastamentoInicio)} a ${formatarDataBR(dataAfastamentoFim)}`;
    } else if (dataAfastamentoInicio) {
      return `A partir de ${formatarDataBR(dataAfastamentoInicio)}`;
    } else if (dataAfastamentoFim) {
      return `Até ${formatarDataBR(dataAfastamentoFim)}`;
    }
    return 'Geral / Não especificado';
  }, [dataAfastamentoInicio, dataAfastamentoFim]);

  const periodoRetornoDesc = useMemo(() => {
    if (dataRetornoInicio && dataRetornoFim) {
      return `${formatarDataBR(dataRetornoInicio)} a ${formatarDataBR(dataRetornoFim)}`;
    } else if (dataRetornoInicio) {
      return `A partir de ${formatarDataBR(dataRetornoInicio)}`;
    } else if (dataRetornoFim) {
      return `Até ${formatarDataBR(dataRetornoFim)}`;
    }
    return 'Geral / Não especificado';
  }, [dataRetornoInicio, dataRetornoFim]);

  // Agrupamento estruturado por Secretaria Municipal
  const groupedBySecretaria = useMemo(() => {
    const groupsMap = new Map<string, Occurrence[]>();

    for (const occ of filteredOccurrences) {
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

  // Geração e Download Direto do PDF em Formato Paisagem (A4 Landscape)
  const handleDownloadPDF = async () => {
    const reportElement = document.getElementById('executive-report-landscape');
    if (!reportElement) {
      alert('Elemento do relatório não encontrado.');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      setStatusMessage('Processando documento oficial e gerando PDF em A4 Paisagem...');

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1240,
      });

      setStatusMessage('Compilando páginas para emissão...');

      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfPageWidth = pdf.internal.pageSize.getWidth(); // 297 mm
      const pdfPageHeight = pdf.internal.pageSize.getHeight(); // 210 mm

      const margin = 8;
      const printableWidth = pdfPageWidth - (margin * 2);
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      if (imgHeight <= (pdfPageHeight - (margin * 2))) {
        const yOffset = margin + ((pdfPageHeight - (margin * 2) - imgHeight) / 2);
        pdf.addImage(imgData, 'JPEG', margin, yOffset, printableWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, imgHeight);
        heightLeft -= (pdfPageHeight - (margin * 2));

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, imgHeight);
          heightLeft -= (pdfPageHeight - (margin * 2));
        }
      }

      const fileName = `Relatorio_Mensal_IPME_Prefeitura_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      setStatusMessage('PDF gerado e baixado com sucesso!');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      console.error('Falha ao gerar PDF:', err);
      setStatusMessage('Não foi possível gerar o arquivo diretamente. Tentando abrir caixa de impressão...');
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
                margin: 8mm 10mm;
              }
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 12px !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #executive-report-landscape {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 auto !important;
                box-shadow: none !important;
                border: none !important;
                background: #ffffff !important;
              }
              .page-break-avoid {
                break-inside: avoid;
                page-break-inside: avoid;
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
            margin: 8mm 10mm 8mm 10mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11px !important;
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
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .page-break-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-[1360px] border border-slate-200 shadow-2xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Barra Superior Principal: Título & Ações */}
        <div className="px-5 py-3.5 bg-slate-950 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 print-hidden shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider truncate">
                  Relatório Mensal de Afastamentos & Atos Homologados
                </h2>
                <span className="font-mono text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50 shrink-0">
                  Envio Oficial à Prefeitura
                </span>
                <span className="font-mono text-[10px] font-bold text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-700/50 shrink-0">
                  Formato A4 Paisagem
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
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
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              title="Abrir caixa de diálogo de impressão do navegador"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-0.5 cursor-pointer shrink-0"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros para Emissão: Tipo de ato, data de afastamento e retorno */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-white flex flex-wrap items-center justify-between gap-3 print-hidden shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Tipo de Ato */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 shrink-0">
              <FileCheck2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-300">Tipo de Ato:</span>
              <select
                value={tipoFiltro}
                onChange={e => setTipoFiltro(e.target.value as any)}
                className="bg-transparent text-slate-100 text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="all" className="bg-slate-900 text-white">Todos os Atos</option>
                <option value="Licença Saúde" className="bg-slate-900 text-white">Licença Saúde</option>
                <option value="Readaptação" className="bg-slate-900 text-white">Readaptação</option>
                <option value="Licença Definitiva" className="bg-slate-900 text-white">Licença Definitiva</option>
                <option value="Licença Maternidade" className="bg-slate-900 text-white">Licença Maternidade</option>
              </select>
            </div>

            {/* 2. Secretaria de Lotação */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-300">Secretaria:</span>
              <select
                value={secretariaFiltro}
                onChange={e => setSecretariaFiltro(e.target.value)}
                className="bg-transparent text-slate-100 text-xs focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] truncate font-medium"
              >
                <option value="all" className="bg-slate-900 text-white">Todas Secretarias</option>
                {secretarias.map(sec => (
                  <option key={sec.id} value={sec.sigla} className="bg-slate-900 text-white">
                    {sec.sigla} - {sec.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Data de Afastamento (De / Até) */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-300">Afastamento:</span>
              <input
                type="date"
                value={dataAfastamentoInicio}
                onChange={e => setDataAfastamentoInicio(e.target.value)}
                title="Data inicial de afastamento"
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input
                type="date"
                value={dataAfastamentoFim}
                onChange={e => setDataAfastamentoFim(e.target.value)}
                title="Data final de afastamento"
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* 4. Data de Retorno (De / Até) */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-300">Retorno:</span>
              <input
                type="date"
                value={dataRetornoInicio}
                onChange={e => setDataRetornoInicio(e.target.value)}
                title="Data inicial de retorno"
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded focus:outline-none focus:border-sky-500 font-mono"
              />
              <span className="text-slate-400 text-xs">até</span>
              <input
                type="date"
                value={dataRetornoFim}
                onChange={e => setDataRetornoFim(e.target.value)}
                title="Data final de retorno"
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* Presets Rápidos de Mês */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-slate-700 text-[11px]">
              <button
                type="button"
                onClick={setPresetMesAtual}
                className="px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Preencher afastamento com o mês atual"
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={setPresetMesAnterior}
                className="px-2 py-0.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Preencher afastamento com o mês anterior"
              >
                Mês Anterior
              </button>
            </div>

            {/* Botão Limpar Filtros */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2 shrink-0">
            <span>Registros no Recorte: <strong className="text-white">{filteredOccurrences.length}</strong></span>
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
        <div className="overflow-y-auto overflow-x-hidden p-4 sm:p-8 bg-slate-100/70 print:p-0 print:bg-white flex-1">
          
          {/* THE OFFICIAL LANDSCAPE CANVAS (A4 Landscape) */}
          <div 
            id="executive-report-landscape" 
            className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-6 sm:p-8 mx-auto max-w-[1280px] text-slate-900 space-y-6 print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none"
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
                    RELATÓRIO MENSAL DE AFASTAMENTOS E ATOS HOMOLOGADOS
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Demonstrativo oficial de licenças médicas e readaptações periciadas pela Junta Médica Oficial para remessa à Prefeitura.
                  </p>
                </div>
                
                {/* Resumo dos Filtros Aplicados no Relatório */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700 bg-slate-50 border border-slate-200 p-2 rounded-lg">
                  <div>
                    <span className="text-slate-400 font-medium">Ato: </span>
                    <strong className="text-slate-900">{tipoFiltro === 'all' ? 'Todos' : tipoFiltro}</strong>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div>
                    <span className="text-slate-400 font-medium">Afastamento: </span>
                    <strong className="text-slate-900">{periodoAfastamentoDesc}</strong>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div>
                    <span className="text-slate-400 font-medium">Retorno: </span>
                    <strong className="text-slate-900">{periodoRetornoDesc}</strong>
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
            </div>

            {/* 2. TABELA PRINCIPAL: DETALHAMENTO DOS AFASTAMENTOS E ATOS HOMOLOGADOS AGRUPADOS POR SECRETARIA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  <span>Detalhamento dos Afastamentos e Atos Homologados</span>
                  <span className="font-normal font-mono text-slate-600 text-[11px]">
                    ({filteredOccurrences.length} atos homologados em {groupedBySecretaria.length} secretarias)
                  </span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Agrupado por Secretaria Municipal · Junta Médica Oficial IPME
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900 text-white font-semibold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-2.5 text-center w-8">Nº</th>
                      <th className="py-2.5 px-3">Servidor / Matrícula / CPF</th>
                      <th className="py-2.5 px-3">Cargo Funcional</th>
                      <th className="py-2.5 px-3">Tipo de Ato</th>
                      <th className="py-2.5 px-3">Data Afastamento</th>
                      <th className="py-2.5 px-3">Data Retorno</th>
                      <th className="py-2.5 px-3 text-center">Dias Totais</th>
                      <th className="py-2.5 px-3 text-center">Dias Pagos IPME</th>
                      <th className="py-2.5 px-3">CID-10</th>
                      <th className="py-2.5 px-3">Perito Oficial / CRM</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>

                  {filteredOccurrences.length === 0 ? (
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500">
                          <p className="font-semibold text-slate-700 text-sm">Nenhum afastamento encontrado para os filtros selecionados.</p>
                          <p className="text-xs text-slate-400 mt-1">Ajuste o período de afastamento, retorno ou tipo de ato na barra superior.</p>
                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    (() => {
                      let globalSeq = 0;
                      return groupedBySecretaria.map((group) => (
                        <tbody key={group.secretariaNome} className="divide-y divide-slate-100 text-[11px] border-b-2 border-slate-300">
                          {/* Faixa Cabeçalho da Secretaria */}
                          <tr className="bg-slate-800 text-white font-semibold text-xs page-break-avoid">
                            <td colSpan={11} className="py-2.5 px-3">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="font-bold uppercase tracking-wider text-xs">
                                    {group.secretariaNome}
                                  </span>
                                  <span className="bg-slate-700 text-slate-200 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                                    {group.secretariaSigla}
                                  </span>
                                </div>
                                <div className="text-[11px] font-normal text-slate-300 flex items-center gap-2.5 flex-wrap">
                                  <span><strong>{group.subtotalAtos}</strong> ato(s) homologado(s)</span>
                                  <span>·</span>
                                  <span>Saúde: <strong>{group.subtotalSaude}</strong> | Readaptação: <strong>{group.subtotalReadaptacao}</strong> | Definitiva: <strong>{group.subtotalDefinitiva}</strong> | Maternidade: <strong>{group.subtotalMaternidade}</strong></span>
                                  <span>·</span>
                                  <span>Dias Totais: <strong>{group.subtotalDiasCorridos}d</strong></span>
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
                              <tr key={occ.id} className="hover:bg-slate-50/70 transition-colors">
                                {/* Seq Global */}
                                <td className="py-2.5 px-2.5 text-center font-mono text-[10px] text-slate-400 font-semibold">
                                  {currentSeq}
                                </td>

                                {/* Servidor */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="font-bold text-slate-900 block text-xs">
                                    {occ.employee_nome || emp?.nome || 'Servidor'}
                                  </span>
                                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                                    <span>Matr. <strong>{occ.matricula}</strong></span>
                                    {emp?.cpf && (
                                      <span>· CPF {formatarCPF(emp.cpf)}</span>
                                    )}
                                  </div>
                                </td>

                                {/* Cargo Funcional */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="font-medium text-slate-800 block text-[11px]">
                                    {occ.employee_cargo || emp?.cargo || 'Servidor Municipal'}
                                  </span>
                                </td>

                                {/* Tipo de Ato */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
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
                                <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-800 font-medium">
                                  {formatarDataBR(occ.data_inicio)}
                                </td>

                                {/* Data Retorno */}
                                <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-800 font-medium">
                                  {occ.tipo === 'Licença Definitiva' ? (
                                    <div className="flex flex-col text-[10px]">
                                      <span className="font-bold text-purple-900">Definitiva</span>
                                      <span className="text-purple-700">Conc: {formatarDataBR(occ.data_concessao || occ.data_inicio)}</span>
                                    </div>
                                  ) : (
                                    formatarDataBR(occ.data_termino)
                                  )}
                                </td>

                                {/* Total Dias */}
                                <td className="py-2.5 px-3 whitespace-nowrap text-center font-mono font-bold text-slate-900">
                                  {occ.quantidade_dias}d
                                </td>

                                {/* Dias Pagos IPME */}
                                <td className="py-2.5 px-3 whitespace-nowrap text-center">
                                  {diasPagos > 0 ? (
                                    <span className="font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                      {diasPagos} dias
                                    </span>
                                  ) : (
                                    <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]" title="Custeado pela folha patronal da Prefeitura (1º ao 15º dia)">
                                      0d (Prefeitura)
                                    </span>
                                  )}
                                </td>

                                {/* CID-10 */}
                                <td className="py-2.5 px-3 max-w-[140px] truncate" title={occ.cid || '-'}>
                                  {occ.cid ? (
                                    <span className="font-mono font-medium text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                      {occ.cid.split(' - ')[0]}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>

                                {/* Médico Perito */}
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="font-medium text-slate-800 block text-[10px] truncate max-w-[140px]">
                                    {occ.medico_perito}
                                  </span>
                                  <span className="font-mono text-[9px] text-slate-500">
                                    {occ.crm}
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="py-2.5 px-3 whitespace-nowrap text-center">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    occ.status === 'Ativa' 
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                      : occ.status === 'Prorrogada' 
                                      ? 'bg-purple-50 text-purple-800 border-purple-200' 
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {occ.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Subtotal da Secretaria */}
                          <tr className="bg-slate-100/90 font-semibold text-slate-800 text-[10px] border-t border-slate-300 page-break-avoid">
                            <td colSpan={3} className="py-2 px-3">
                              <span className="text-slate-600 uppercase font-mono">
                                Subtotal {group.secretariaSigla}:
                              </span>{' '}
                              <span className="text-slate-900 font-bold">{group.subtotalAtos} ato(s)</span>
                            </td>
                            <td colSpan={3} className="py-2 px-3 text-right text-slate-600 font-mono">
                              Soma de Afastamentos da Secretaria:
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-slate-950">
                              {group.subtotalDiasCorridos}d
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-emerald-800">
                              {group.subtotalDiasIPME}d
                            </td>
                            <td colSpan={3} className="py-2 px-3 text-slate-500 font-normal text-[10px]">
                              ({group.subtotalDiasPrefeitura}d na folha patronal da Prefeitura)
                            </td>
                          </tr>
                        </tbody>
                      ));
                    })()
                  )}

                  {/* Linha de Totais Gerais Consolidados */}
                  {filteredOccurrences.length > 0 && (
                    <tfoot className="bg-slate-900 text-white font-semibold text-xs border-t-2 border-slate-950">
                      <tr>
                        <td colSpan={4} className="py-3 px-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span>TOTAL GERAL CONSOLIDADO: <strong>{totals.totalRegistros} atos em {groupedBySecretaria.length} secretaria(s)</strong></span>
                            <span className="text-slate-500">·</span>
                            <span className="text-slate-300 text-[11px]">Saúde: <strong>{totals.totalLicencaSaude}</strong> | Readaptação: <strong>{totals.totalReadaptacao}</strong> | Definitiva: <strong>{totals.totalLicencaDefinitiva}</strong> | Maternidade: <strong>{totals.totalLicencaMaternidade}</strong></span>
                          </div>
                        </td>
                        <td colSpan={2} className="py-3 px-3 text-right text-slate-300 font-mono text-[10px] uppercase">
                          Soma Geral de Dias:
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-white text-xs">
                          {totals.totalDiasCorridos} dias
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-300 text-xs">
                          {totals.totalDiasIPME} dias pagos
                        </td>
                        <td colSpan={3} className="py-3 px-3 text-slate-300 text-[10px]">
                          * {totals.totalDiasPrefeitura} dias na folha patronal da Prefeitura (1º ao 15º dia).
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* 3. ASSINATURAS INSTITUCIONAIS & VALIDAÇÃO */}
            <div className="page-break-avoid pt-6 border-t-2 border-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
                
                {/* Assinatura 1: Junta Médica / Diretor Médico */}
                <div className="space-y-1">
                  <div className="border-b border-slate-400 w-3/4 mx-auto h-9"></div>
                  <span className="font-bold text-slate-900 block text-xs">
                    {diretorMedico ? diretorMedico.nome : 'Dr. Marcelo Cavalcante Holanda'}
                  </span>
                  <span className="text-[10px] text-slate-600 block">
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
