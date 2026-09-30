import React from 'react';
import { Occurrence, ExtensionRecord } from '../types/index.ts';
import { formatarDataBR, formatarDataHoraBR, calcularDiasPagos } from '../utils/validation.ts';
import { 
  X, 
  Clock, 
  History, 
  Calendar, 
  UserCheck, 
  FileText, 
  Printer, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  FileBadge
} from 'lucide-react';

interface ProrrogacoesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
  onOpenPrint?: (occ: Occurrence) => void;
  onOpenNewProrrogacao?: (occ: Occurrence) => void;
  onOpenAuditTrail?: () => void;
  canEdit?: boolean;
}

export const ProrrogacoesHistoryModal: React.FC<ProrrogacoesHistoryModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  onOpenPrint,
  onOpenNewProrrogacao,
  onOpenAuditTrail,
  canEdit = false,
}) => {
  if (!isOpen || !occurrence) return null;

  const prorrogacoes: ExtensionRecord[] = occurrence.prorrogacoes || [];
  const totalProrrogacoes = prorrogacoes.length;
  const diasPagosTotais = calcularDiasPagos(occurrence.quantidade_dias);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Histórico de Prorrogações
                </h2>
                <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/50">
                  Nº {occurrence.id}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                  occurrence.tipo === 'Licença Saúde' 
                    ? 'bg-amber-100/90 text-amber-900 border-amber-300' 
                    : occurrence.tipo === 'Readaptação'
                    ? 'bg-sky-100/90 text-sky-900 border-sky-300'
                    : occurrence.tipo === 'Licença Definitiva'
                    ? 'bg-purple-100/90 text-purple-900 border-purple-300'
                    : 'bg-pink-100/90 text-pink-900 border-pink-300'
                }`}>
                  {occurrence.tipo}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Rastreabilidade cronológica e pareceres periciais de extensão de prazos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Servidor Summary Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>{occurrence.employee_nome || 'Servidor'}</span>
              <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {occurrence.matricula}
              </span>
            </div>
            <div className="text-slate-500 text-xs mt-0.5 flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-700">{occurrence.employee_cargo}</span>
              <span>·</span>
              <span>{occurrence.employee_secretaria}</span>
              {occurrence.cid && (
                <>
                  <span>·</span>
                  <span className="font-mono text-slate-700 bg-slate-200/60 px-1 rounded text-[11px]">
                    CID: {occurrence.cid.split(' - ')[0]}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenPrint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrint(occurrence);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Laudo Oficial</span>
              </button>
            )}
            {canEdit && occurrence.status !== 'Concluída' && occurrence.status !== 'Cancelada' && onOpenNewProrrogacao && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewProrrogacao(occurrence);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nova Prorrogação</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Metrics Bar */}
        <div className="p-4 bg-white border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
              Início do Afastamento
            </span>
            <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">
              {formatarDataBR(occurrence.data_inicio)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
              Término Atual Vigente
            </span>
            <span className="text-xs font-bold font-mono text-emerald-800 mt-0.5 block">
              {formatarDataBR(occurrence.data_termino)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
              Total Acumulado
            </span>
            <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">
              {occurrence.quantidade_dias} dias
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
            <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider block">
              Dias Pagos pelo IPME
            </span>
            <span className="text-xs font-bold font-mono text-emerald-900 mt-0.5 block">
              {diasPagosTotais} dias
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Linha do Tempo dos Atos Periciais ({totalProrrogacoes + 1} {totalProrrogacoes === 0 ? 'registro' : 'registros'})
            </h3>
            <span className="text-[11px] text-slate-500">
              {totalProrrogacoes === 0 ? 'Concessão original' : `${totalProrrogacoes} prorrogação(ões) registrada(s)`}
            </span>
          </div>

          {/* 1. Concessão Original (Marco Zero) */}
          <div className="relative pl-6 pb-2 border-l-2 border-slate-200">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-700 border-2 border-white shadow-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Concessão Inicial (1º Laudo Pericial)
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    Origem
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatarDataHoraBR(occurrence.created_at)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">Período Inicial:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatarDataBR(occurrence.data_inicio)} até {formatarDataBR(occurrence.data_termino_inicial || occurrence.data_termino)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Perito Inicial:</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {occurrence.medico_perito}
                  </span>
                  <span className="text-[10px] text-slate-500">{occurrence.crm}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cadastrado por:</span>
                  <span className="text-slate-700 truncate block">
                    {occurrence.created_by}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Prorrogações Homologadas */}
          {prorrogacoes.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-500 text-xs">
              <p className="font-medium text-slate-700">Nenhuma prorrogação registrada para este afastamento.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                O benefício vigora com base exclusivamente na data original de término ({formatarDataBR(occurrence.data_termino_inicial || occurrence.data_termino)}).
              </p>
            </div>
          ) : (
            prorrogacoes.map((item, idx) => (
              <div key={item.id || idx} className="relative pl-6 pb-2 border-l-2 border-amber-300">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow-xs flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2.5 text-xs shadow-2xs">
                  {/* Top: Sequencial and Date */}
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-950 text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        {item.sequencial}ª Prorrogação Concedida
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                        +{item.dias_adicionados} dias
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-900/70 font-mono">
                      Homologado em: {formatarDataHoraBR(item.created_at)}
                    </span>
                  </div>

                  {/* Period extension info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-white/90 p-2.5 rounded-lg border border-amber-200/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Extensão do Prazo:</span>
                      <div className="flex items-center gap-1 font-mono font-semibold text-slate-800">
                        <span className="text-slate-500 line-through text-[11px]">
                          {formatarDataBR(item.data_anterior_termino)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="text-amber-950 font-bold">
                          {formatarDataBR(item.nova_data_termino)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Acúmulo Previdenciário:</span>
                      <span className="font-semibold text-slate-800 block">
                        Total {item.dias_totais_acumulados}d corridos
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold font-mono">
                        {item.dias_pagos_acumulados}d pagos pelo IPME
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Perito Homologador:</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {item.medico_perito}
                      </span>
                      <span className="text-[10px] text-slate-500">{item.crm}</span>
                    </div>
                  </div>

                  {/* Motivo */}
                  <div className="bg-amber-100/50 p-2 rounded-lg border border-amber-200/60 text-amber-950 text-[11px]">
                    <span className="font-semibold text-amber-900 block text-[10px] uppercase tracking-wider">
                      Fundamentação Clínica / Parecer Pericial:
                    </span>
                    <p className="mt-0.5 leading-relaxed text-slate-800">
                      {item.motivo}
                    </p>
                    <div className="mt-1 text-[10px] text-slate-500 flex items-center justify-between border-t border-amber-200/60 pt-1">
                      <span>Responsável pelo lançamento: {item.created_by}</span>
                      <span className="font-mono text-slate-400">ID: {item.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* 3. Marco de Concessão de Licença Definitiva (Se aplicável) */}
          {occurrence.tipo === 'Licença Definitiva' && (
            <div className="relative pl-6 pb-2 border-l-2 border-purple-500">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-600 border-2 border-white shadow-xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/90 border border-purple-200 space-y-2.5 text-xs shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-purple-950 text-xs flex items-center gap-1.5">
                      <FileBadge className="w-4 h-4 text-purple-700" />
                      Homologação em Licença Definitiva (Incapacidade Permanente)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900 border border-purple-300">
                      Definitiva
                    </span>
                  </div>
                  {occurrence.data_conversao && (
                    <span className="text-[11px] text-purple-800 font-mono">
                      Convertido em: {formatarDataHoraBR(occurrence.data_conversao)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-purple-200/80">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data Oficial da Concessão:</span>
                    <span className="font-mono font-bold text-purple-950 text-xs">
                      {formatarDataBR(occurrence.data_concessao || occurrence.data_inicio)}
                    </span>
                    {occurrence.ato_concessao && (
                      <span className="text-[10px] text-purple-700 block mt-0.5 font-medium">
                        {occurrence.ato_concessao}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Perito Homologador:</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {occurrence.medico_perito}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{occurrence.crm}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Efeito Jurídico:</span>
                    <span className="font-semibold text-purple-900 block">
                      Incapacidade Permanente
                    </span>
                    <span className="text-[10px] text-slate-500">Sem retorno previsto</span>
                  </div>
                </div>

                {occurrence.motivo_definitiva && (
                  <div className="bg-purple-100/60 p-2 rounded-lg border border-purple-200 text-purple-950 text-[11px]">
                    <span className="font-semibold text-purple-900 block text-[10px] uppercase tracking-wider">
                      Fundamento da Transformação:
                    </span>
                    <p className="mt-0.5 text-slate-800">{occurrence.motivo_definitiva}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Registros com rastreabilidade na Trilha de Auditoria</span>
            </div>
            {onOpenAuditTrail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuditTrail();
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-purple-600" />
                <span>Ver Trilha Completa</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white hover:bg-slate-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
