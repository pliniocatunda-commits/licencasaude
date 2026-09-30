import React, { useState } from 'react';
import { Occurrence, Employee } from '../types/index.ts';
import { formatarCPF, formatarDataBR, formatarTelefone, calcularDiasPagos } from '../utils/validation.ts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { X, Printer, Download, ShieldCheck, Loader2 } from 'lucide-react';

interface PrintCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
  employee?: Employee;
}

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  employee,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !occurrence) return null;

  const handleDownloadPDF = async () => {
    const el = document.getElementById('printable-certificate');
    if (!el) return;

    try {
      setIsGenerating(true);
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printableWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * printableWidth) / canvas.width;

      if (imgHeight <= pageHeight - (margin * 2)) {
        pdf.addImage(imgData, 'JPEG', margin, margin, printableWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, imgHeight);
        heightLeft -= (pageHeight - (margin * 2));

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, printableWidth, imgHeight);
          heightLeft -= (pageHeight - (margin * 2));
        }
      }

      pdf.save(`Laudo_Pericial_IPME_${occurrence.id}_${occurrence.matricula}.pdf`);
    } catch (e) {
      console.error('Erro ao gerar laudo PDF:', e);
      handlePrint();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById('printable-certificate');
    if (!el) {
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

      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(s => s.outerHTML)
        .join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>Laudo Pericial Oficial - IPME Eusébio</title>
            ${styles}
            <style>
              @page { size: A4 portrait; margin: 12mm 15mm; }
              body { background: white !important; padding: 15px !important; }
            </style>
          </head>
          <body>
            <div>${el.outerHTML}</div>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 3000);
      }, 400);
    } catch (err) {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Documento Oficial de Homologação Pericial · IPME</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Baixar arquivo PDF diretamente no computador"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Abrir caixa de diálogo de impressão"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto print:overflow-visible font-serif text-slate-900 space-y-6 bg-white" id="printable-certificate">
          
          {/* Official Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden border border-emerald-900/30 flex items-center justify-center">
              <img 
                src="/src/assets/images/ipme_seal_logo_1790337165041.jpg" 
                alt="Brasão IPME"
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-sm font-bold tracking-wider uppercase">
              ESTADO DO CEARÁ · PREFEITURA MUNICIPAL DE EUSÉBIO
            </h1>
            <h2 className="text-base font-extrabold tracking-tight uppercase text-emerald-950 font-sans">
              IPME — INSTITUTO DE PREVIDÊNCIA DO MUNICÍPIO DE EUSÉBIO
            </h2>
            <p className="text-xs font-medium tracking-wide uppercase font-sans text-slate-600">
              JUNTA MÉDICA PERICIAL OFICIAL · DEPARTAMENTO DE BENEFÍCIOS
            </p>
          </div>

          {/* Document Title & Protocol */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300 pb-3 font-sans">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                NATUREZA DO ATO PERICIAL
              </span>
              <span className="text-base font-bold text-slate-900">
                {occurrence.tipo === 'Licença Saúde' 
                  ? 'LAUDO DE HOMOLOGAÇÃO DE LICENÇA MÉDICA' 
                  : occurrence.tipo === 'Licença Definitiva'
                  ? 'LAUDO PERICIAL DE LICENÇA / APOSENTADORIA DEFINITIVA'
                  : occurrence.tipo === 'Licença Maternidade'
                  ? 'CERTIFICADO DE CONCESSÃO DE LICENÇA MATERNIDADE'
                  : 'CERTIFICADO DE READAPTAÇÃO FUNCIONAL'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                REGISTRO / PROTOCOLO IPME
              </span>
              <span className="text-sm font-bold font-mono text-emerald-900">
                Nº {occurrence.id}
              </span>
            </div>
          </div>

          {/* Section 1: Servidor Identification */}
          <div className="space-y-3 font-sans text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-3 py-1 rounded">
              1. IDENTIFICAÇÃO DO SERVIDOR PÚBLICO MUNICIPAL
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-3">
              <div className="sm:col-span-2">
                <span className="text-slate-500 block text-[11px]">Nome Completo:</span>
                <span className="font-bold text-slate-900 text-sm">{occurrence.employee_nome || employee?.nome}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Matrícula Funcional:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{occurrence.matricula}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">CPF:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {employee ? formatarCPF(employee.cpf) : 'Registrado no Prontuário'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Cargo / Função:</span>
                <span className="font-semibold text-slate-800">{occurrence.employee_cargo || employee?.cargo}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Telefone / Contato:</span>
                <span className="font-mono text-slate-800">
                  {employee?.telefone ? formatarTelefone(employee.telefone) : '-'}
                </span>
              </div>

              <div className="sm:col-span-3">
                <span className="text-slate-500 block text-[11px]">Secretaria de Origem:</span>
                <span className="font-medium text-slate-800">{occurrence.employee_secretaria || employee?.secretaria}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Concessão e Prazos */}
          <div className="space-y-3 font-sans text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-3 py-1 rounded">
              2. DELIBERAÇÃO TEMPORAL E PRAZOS CONCEDIDOS
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Data de Início:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatarDataBR(occurrence.data_inicio)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">
                  {occurrence.tipo === 'Licença Definitiva' ? 'Data da Concessão Definitiva:' : 'Término / Previsão de Retorno:'}
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {occurrence.tipo === 'Licença Definitiva' 
                    ? formatarDataBR(occurrence.data_concessao || occurrence.data_inicio) 
                    : formatarDataBR(occurrence.data_termino)}
                </span>
                {occurrence.tipo === 'Licença Definitiva' && occurrence.ato_concessao && (
                  <span className="text-[10px] text-purple-700 block font-sans">
                    {occurrence.ato_concessao}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total de Dias Corridos:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {occurrence.quantidade_dias} {occurrence.quantidade_dias === 1 ? 'dia' : 'dias'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Status do Afastamento:</span>
                <span className="font-bold text-slate-800 uppercase">
                  {occurrence.status}
                </span>
              </div>

              <div className="sm:col-span-4 bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-950 block uppercase">
                    Benefício Previdenciário (IPME) — Dias Pagos:
                  </span>
                  <span className="text-[11px] text-emerald-800">
                    Regra estatutária: os 15 primeiros dias de afastamento são assumidos pela Prefeitura Municipal de Eusébio.
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-900 text-base">
                    {calcularDiasPagos(occurrence.quantidade_dias)} {calcularDiasPagos(occurrence.quantidade_dias) === 1 ? 'dia pago' : 'dias pagos'}
                  </span>
                </div>
              </div>

              {occurrence.cid && (
                <div className="sm:col-span-4">
                  <span className="text-slate-500 block text-[11px]">Classificação Diagnóstica (CID-10):</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {occurrence.cid}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2.1: Histórico Oficial de Prorrogações (se houver) */}
          {occurrence.prorrogacoes && occurrence.prorrogacoes.length > 0 && (
            <div className="space-y-3 font-sans text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-3 py-1 rounded flex items-center justify-between">
                <span>HISTÓRICO DE PRORROGAÇÕES HOMOLOGADAS (JUNTA MÉDICA OFICIAL)</span>
                <span className="text-[10px] font-mono font-normal text-slate-600">
                  {occurrence.prorrogacoes.length} {occurrence.prorrogacoes.length === 1 ? 'ato registrado' : 'atos registrados'}
                </span>
              </h3>

              <div className="px-3">
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Ato</th>
                        <th className="py-2 px-3">Período Estendido</th>
                        <th className="py-2 px-3 text-center">Acréscimo</th>
                        <th className="py-2 px-3 text-center">Dias Pagos</th>
                        <th className="py-2 px-3">Perito Homologador</th>
                        <th className="py-2 px-3">Justificativa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {occurrence.prorrogacoes.map(prorr => (
                        <tr key={prorr.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-bold text-slate-800 font-mono whitespace-nowrap">
                            {prorr.sequencial}ª Prorr.
                          </td>
                          <td className="py-2 px-3 font-mono whitespace-nowrap">
                            {formatarDataBR(prorr.data_anterior_termino)} → <strong className="text-slate-900">{formatarDataBR(prorr.nova_data_termino)}</strong>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-emerald-800 whitespace-nowrap">
                            +{prorr.dias_adicionados}d
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-slate-700 whitespace-nowrap">
                            {prorr.dias_pagos_acumulados}d
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 block">{prorr.medico_perito}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{prorr.crm}</span>
                          </td>
                          <td className="py-2 px-3 text-slate-700 max-w-xs text-[10px]">
                            {prorr.motivo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Parecer Técnico Pericial */}
          <div className="space-y-3 font-sans text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] bg-slate-100 px-3 py-1 rounded">
              3. PARECER CONCLUSIVO DA JUNTA MÉDICA PERICIAL
            </h3>

            <div className="px-3 space-y-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed text-slate-800 font-serif text-sm">
                {occurrence.parecer_tecnico || (
                  occurrence.tipo === 'Licença Saúde'
                    ? 'Atestamos que o(a) servidor(a) supracitado(a) foi submetido(a) a exame pericial oficial pelo IPME, concluindo-se pela incapacidade temporária para o desempenho de suas atribuições rotineiras durante o período assinalado.'
                    : occurrence.tipo === 'Licença Definitiva'
                    ? 'Atestamos que o(a) servidor(a) supracitado(a) foi submetido(a) a exame pericial minucioso pela Junta Médica Pericial Oficial do IPME, concluindo-se pela incapacidade laborativa permanente e definitiva para o serviço público municipal.'
                    : occurrence.tipo === 'Licença Maternidade'
                    ? 'Homologamos a concessão de Licença Maternidade estatutária à servidora pública municipal pelo período de 180 (cento e oitenta) dias, nos termos da legislação municipal e do Programa Servidora Cidadã.'
                    : 'Atestamos que o(a) servidor(a) supracitado(a) possui aptidão funcional com restrições ergonômicas/físicas específicas, deliberando-se pela sua readaptação funcional temporária para exercício de atividades compatíveis com suas limitações de saúde.'
                )}
              </div>

              {occurrence.observacoes && (
                <div className="text-[11px] text-slate-600">
                  <strong>Observações Administrativas:</strong> {occurrence.observacoes}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Signatures */}
          <div className="pt-10 font-sans text-xs space-y-10">
            <div className="text-center text-slate-600 text-xs">
              Eusébio - CE, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.
            </div>

            <div className="grid grid-cols-2 gap-8 text-center pt-6">
              <div className="space-y-1">
                <div className="border-t border-slate-900 w-4/5 mx-auto"></div>
                <div className="font-bold text-slate-900">{occurrence.medico_perito}</div>
                <div className="text-[11px] font-mono text-slate-600">{occurrence.crm}</div>
                <div className="text-[10px] uppercase font-semibold text-slate-500">Médico Perito Oficial do IPME</div>
              </div>

              <div className="space-y-1">
                <div className="border-t border-slate-900 w-4/5 mx-auto"></div>
                <div className="font-bold text-slate-900">{occurrence.employee_nome || employee?.nome}</div>
                <div className="text-[11px] font-mono text-slate-600">Matrícula: {occurrence.matricula}</div>
                <div className="text-[10px] uppercase font-semibold text-slate-500">Assinatura / Ciência do Servidor</div>
              </div>
            </div>
          </div>

          {/* Official Footer Verification */}
          <div className="pt-6 border-t border-slate-200 text-center font-sans text-[10px] text-slate-400">
            Instituto de Previdência do Município de Eusébio (IPME) · CNPJ: 05.885.645/0001-30 · Eusébio - Ceará · Documento gerado com autenticação eletrônica regulamentar.
          </div>
        </div>
      </div>
    </div>
  );
};
