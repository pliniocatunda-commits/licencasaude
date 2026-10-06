import React from 'react';
import { Employee, Occurrence } from '../types/index.ts';
import { 
  formatarCPF, 
  formatarTelefone, 
  formatarDataBR, 
  formatarDataHoraBR,
  calcularDiasPagos,
  isPrevisaoRetornoEmAtraso
} from '../utils/validation.ts';
import { 
  X, 
  User, 
  Calendar, 
  Building, 
  Briefcase, 
  Phone, 
  Mail, 
  FileText, 
  HeartPulse, 
  RefreshCw, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Paperclip,
  AlertCircle,
  Stethoscope,
  Trash2,
  FileBadge,
  History,
  Undo2,
  Archive
} from 'lucide-react';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: (Employee & { history?: Occurrence[] }) | null;
  onOpenNewOccurrence: (matricula: string) => void;
  onPrintOccurrence: (occ: Occurrence) => void;
  onOpenProrrogar: (occ: Occurrence) => void;
  onOpenConcluir: (occ: Occurrence) => void;
  onOpenConverterDefinitiva?: (occ: Occurrence) => void;
  onOpenRetornoTrabalho?: (occ: Occurrence) => void;
  onOpenHistory?: (occ: Occurrence) => void;
  onDeleteOccurrence?: (id: string) => void;
  userRole?: 'admin' | 'operator';
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  onOpenNewOccurrence,
  onPrintOccurrence,
  onOpenProrrogar,
  onOpenConcluir,
  onOpenConverterDefinitiva,
  onOpenRetornoTrabalho,
  onOpenHistory,
  onDeleteOccurrence,
  userRole,
}) => {
  const [occurrenceToDelete, setOccurrenceToDelete] = React.useState<Occurrence | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !employee) return null;

  const history = employee.history || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold font-mono">
              {employee.matricula.slice(-4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold leading-tight">{employee.nome}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                  {employee.matricula}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prontuário Funcional e Histórico Pericial · IPME Eusébio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewOccurrence(employee.matricula)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Licença</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Employee Info Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-700" />
              <span>Dados Cadastrais do Servidor</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">CPF:</span>
                <span className="font-mono font-semibold text-slate-900">{formatarCPF(employee.cpf)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Telefone / WhatsApp:</span>
                <span className="font-mono text-slate-800">{formatarTelefone(employee.telefone || '') || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Cargo:</span>
                <span className="font-semibold text-slate-800">{employee.cargo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Status Atual:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                  employee.status === 'Ativo'
                    ? 'bg-emerald-100 text-emerald-800'
                    : employee.status === 'Licenciado'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-sky-100 text-sky-800'
                }`}>
                  {employee.status}
                </span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[11px]">Secretaria de Lotação:</span>
                <span className="text-slate-800 font-medium">{employee.secretaria}</span>
              </div>
              {employee.setor && employee.setor !== 'Geral' && (
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Setor de Trabalho:</span>
                  <span className="text-slate-800 font-medium">{employee.setor}</span>
                </div>
              )}

              {employee.email && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Institucional:</span>
                  <span className="text-slate-700">{employee.email}</span>
                </div>
              )}
              {employee.data_admissao && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Data de Admissão:</span>
                  <span className="font-mono text-slate-700">{formatarDataBR(employee.data_admissao)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Historical Timeline of Leaves & Readaptations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Histórico de Licenças Saúde e Readaptações Funcionais</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold">
                  {history.length} {history.length === 1 ? 'registro' : 'registros'}
                </span>
              </h3>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <HeartPulse className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Nenhum afastamento ou readaptação registrado para este servidor.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">O servidor encontra-se em pleno exercício de suas atividades regulares.</p>
                <button
                  onClick={() => onOpenNewOccurrence(employee.matricula)}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Cadastrar Primeiro Afastamento</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((occ, idx) => (
                  <div 
                    key={occ.id} 
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Nº {occ.id}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                          occ.tipo === 'Licença Saúde' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : occ.tipo === 'Readaptação'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : occ.tipo === 'Licença Definitiva'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-pink-50 text-pink-800 border-pink-200'
                        }`}>
                          {occ.tipo}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          occ.status === 'Ativa'
                            ? 'bg-emerald-100 text-emerald-800'
                            : occ.status === 'Prorrogada'
                            ? 'bg-purple-100 text-purple-800'
                            : occ.status === 'Arquivado'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300 font-bold'
                            : occ.status === 'Concluída'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Status: {occ.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {occ.tipo === 'Licença Definitiva' && onOpenRetornoTrabalho && (
                          <button
                            onClick={() => onOpenRetornoTrabalho(occ)}
                            className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Reversão pericial: homologar retorno do servidor da Licença Definitiva / Aposentadoria ao trabalho ativo"
                          >
                            <Undo2 className="w-3 h-3 text-emerald-700" />
                            <span>Retornar ao Trabalho</span>
                          </button>
                        )}
                        {(occ.status === 'Ativa' || occ.status === 'Prorrogada') && (
                          <>
                            {occ.tipo !== 'Licença Definitiva' && onOpenConverterDefinitiva && (
                              <button
                                onClick={() => onOpenConverterDefinitiva(occ)}
                                className="px-2 py-1 text-[11px] font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                title="Converter em Licença Definitiva por incapacidade permanente"
                              >
                                <FileBadge className="w-3 h-3 text-purple-600" />
                                <span>Tornar Definitiva</span>
                              </button>
                            )}
                            {occ.tipo !== 'Licença Definitiva' && (
                              <button
                                onClick={() => onOpenProrrogar(occ)}
                                className="px-2 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                              >
                                Prorrogar
                              </button>
                            )}
                            <button
                              onClick={() => onOpenConcluir(occ)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                                occ.tipo === 'Licença Definitiva'
                                  ? 'text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300'
                                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              }`}
                              title={occ.tipo === 'Licença Definitiva' ? 'Concluir perícia e homologar aposentadoria definitiva (Arquivar)' : 'Concluir perícia médica'}
                            >
                              {occ.tipo === 'Licença Definitiva' ? (
                                <>
                                  <Archive className="w-3 h-3 text-purple-700" />
                                  <span>Concluir / Arquivar</span>
                                </>
                              ) : (
                                <span>Concluir Perícia</span>
                              )}
                            </button>
                          </>
                        )}
                        {onOpenHistory && (
                          <button
                            onClick={() => onOpenHistory(occ)}
                            className="px-2 py-1 text-[11px] font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Ver Histórico Cronológico, Prorrogações e Trilha desta Ocorrência"
                          >
                            <History className="w-3 h-3 text-purple-700" />
                            <span>Histórico</span>
                          </button>
                        )}
                        <button
                          onClick={() => onPrintOccurrence(occ)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          title="Imprimir laudo pericial oficial"
                        >
                          <Printer className="w-3 h-3 text-slate-500" />
                          <span>Imprimir Laudo</span>
                        </button>
                        {userRole === 'admin' && onDeleteOccurrence && (
                          <button
                            onClick={() => setOccurrenceToDelete(occ)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Excluir ocorrência"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Occurrence Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Período de Afastamento:</span>
                        <div className="font-mono text-slate-800 font-semibold flex items-center gap-1.5 flex-wrap">
                          <span>{formatarDataBR(occ.data_inicio)} até</span>
                          {occ.tipo === 'Licença Definitiva' ? (
                            <span>Definitivo</span>
                          ) : isPrevisaoRetornoEmAtraso(occ.data_termino, occ.status, occ.tipo) ? (
                            <span className="font-bold text-rose-800 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded text-[11px] inline-flex items-center gap-1" title="Previsão de retorno expirada!">
                              <AlertCircle className="w-3 h-3 text-rose-600 animate-pulse" />
                              {formatarDataBR(occ.data_termino)} (Em atraso)
                            </span>
                          ) : (
                            <span>{formatarDataBR(occ.data_termino)}</span>
                          )}
                        </div>
                        {occ.tipo === 'Licença Definitiva' && (occ.data_concessao || occ.data_inicio) && (
                          <span className="text-purple-700 block text-[11px] font-semibold">
                            Concessão: {formatarDataBR(occ.data_concessao || occ.data_inicio)}{occ.ato_concessao ? ` (${occ.ato_concessao})` : ''}
                          </span>
                        )}
                        <span className="text-slate-500 block text-[11px]">
                          ({occ.quantidade_dias}d totais · <strong className="text-emerald-700 font-mono">{calcularDiasPagos(occ.quantidade_dias)}d pagos IPME</strong>)
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Classificação CID-10:</span>
                        <span className="font-mono text-slate-800 font-semibold">
                          {occ.cid || 'Não informado / Sigiloso'}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Médico Perito Oficial:</span>
                        <span className="text-slate-800 font-semibold flex items-center gap-1">
                          <Stethoscope className="w-3 h-3 text-emerald-600" />
                          {occ.medico_perito}
                        </span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {occ.crm}
                        </span>
                      </div>
                    </div>

                    {/* Parecer Técnico e Observações */}
                    {occ.prorrogacoes && occ.prorrogacoes.length > 0 && (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            Histórico de Prorrogações ({occ.prorrogacoes.length})
                          </span>
                          <span className="text-[10px] text-amber-800 font-mono">
                            Término original: {formatarDataBR(occ.data_termino_inicial)}
                          </span>
                        </div>
                        <div className="space-y-1.5 divide-y divide-amber-200/50">
                          {occ.prorrogacoes.map((p, idx) => (
                            <div key={p.id || idx} className="pt-1.5 first:pt-0 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span className="font-bold text-amber-900 font-mono">{p.sequencial}ª Prorr:</span>{' '}
                                <span className="text-slate-700">{formatarDataBR(p.data_anterior_termino)} → <strong className="font-mono text-slate-900">{formatarDataBR(p.nova_data_termino)}</strong></span>{' '}
                                <span className="font-mono font-bold text-amber-900 bg-amber-200/70 px-1 rounded text-[10px]">+{p.dias_adicionados}d</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Perito: {p.medico_perito}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {occ.parecer_tecnico && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 block mb-1">
                          Parecer Técnico da Junta Médica Pericial:
                        </span>
                        <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                          {occ.parecer_tecnico}
                        </p>
                      </div>
                    )}

                    {occ.observacoes && (
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Observações Clínicas: </span>
                        <span>{occ.observacoes}</span>
                      </div>
                    )}

                    {occ.anexo_nome && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-500">Documento / Laudo anexado:</span>
                        <span className="font-mono text-emerald-700 font-semibold underline cursor-pointer">
                          {occ.anexo_nome}
                        </span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>Registrado por: {occ.created_by}</span>
                      <span>Criado em: {formatarDataHoraBR(occ.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Fechar Prontuário
          </button>
        </div>
      </div>

      {/* Modal In-App: Confirmação de Exclusão de Ocorrência dentro do Prontuário */}
      {occurrenceToDelete && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold">Excluir Ocorrência</h3>
              </div>
              <button
                onClick={() => setOccurrenceToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Confirmar a exclusão definitiva do registro Nº {occurrenceToDelete.id}?</p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    O afastamento ({occurrenceToDelete.tipo}) será removido do histórico e o status do servidor recalculado automaticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOccurrenceToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (onDeleteOccurrence) {
                      setIsDeleting(true);
                      try {
                        await onDeleteOccurrence(occurrenceToDelete.id);
                        setOccurrenceToDelete(null);
                      } finally {
                        setIsDeleting(false);
                      }
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Excluindo...' : 'Excluir Ocorrência'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
