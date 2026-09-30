import React, { useState, useMemo } from 'react';
import { Occurrence, UserRole, Employee } from '../types/index.ts';
import { ProrrogacoesHistoryModal } from './ProrrogacoesHistoryModal.tsx';
import { 
  formatarDataBR, 
  exportarCSV,
  calcularDiasPagos
} from '../utils/validation.ts';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Printer, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Stethoscope,
  Calendar,
  FileCheck,
  Paperclip,
  Eye,
  History,
  FileSpreadsheet,
  FileBadge
} from 'lucide-react';

interface OccurrencesViewProps {
  occurrences: Occurrence[];
  employees: Employee[];
  userRole: UserRole;
  onRefresh: () => void;
  onOpenNewOccurrence: (matricula?: string) => void;
  onOpenEditOccurrence: (occ: Occurrence) => void;
  onOpenProrrogar: (occ: Occurrence) => void;
  onOpenConcluir: (occ: Occurrence) => void;
  onOpenCancelar: (occ: Occurrence) => void;
  onOpenConverterDefinitiva: (occ: Occurrence) => void;
  onPrintOccurrence: (occ: Occurrence) => void;
  onDeleteOccurrence: (id: string) => void;
  onClearAllOccurrences?: () => Promise<void>;
  onViewEmployeeDetailByMatricula: (matricula: string) => void;
  onOpenExecutiveReport?: () => void;
  onOpenAuditTrail?: () => void;
}

export const OccurrencesView: React.FC<OccurrencesViewProps> = ({
  occurrences,
  employees,
  userRole,
  onRefresh,
  onOpenNewOccurrence,
  onOpenEditOccurrence,
  onOpenProrrogar,
  onOpenConcluir,
  onOpenCancelar,
  onOpenConverterDefinitiva,
  onPrintOccurrence,
  onDeleteOccurrence,
  onClearAllOccurrences,
  onViewEmployeeDetailByMatricula,
  onOpenExecutiveReport,
  onOpenAuditTrail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataTerminoFilter, setDataTerminoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [historyModalOccurrence, setHistoryModalOccurrence] = useState<Occurrence | null>(null);
  const [occurrenceToDelete, setOccurrenceToDelete] = useState<Occurrence | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const pageSize = 8;

  // Filter occurrences
  const filteredOccurrences = useMemo(() => {
    return occurrences.filter(occ => {
      // Tipo
      if (selectedTipo !== 'ALL' && occ.tipo !== selectedTipo) return false;
      // Status
      if (selectedStatus !== 'ALL' && occ.status !== selectedStatus) return false;
      // Date start
      if (dataInicioFilter && occ.data_inicio < dataInicioFilter) return false;
      // Date end
      if (dataTerminoFilter && occ.data_termino > dataTerminoFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchId = occ.id.toLowerCase().includes(q);
        const matchMatricula = occ.matricula.toLowerCase().includes(q);
        const matchNome = (occ.employee_nome || '').toLowerCase().includes(q);
        const matchCargo = (occ.employee_cargo || '').toLowerCase().includes(q);
        const matchSecretaria = (occ.employee_secretaria || '').toLowerCase().includes(q);
        const matchCid = (occ.cid || '').toLowerCase().includes(q);
        const matchPerito = (occ.medico_perito || '').toLowerCase().includes(q);
        return matchId || matchMatricula || matchNome || matchCargo || matchSecretaria || matchCid || matchPerito;
      }
      return true;
    });
  }, [occurrences, searchTerm, selectedTipo, selectedStatus, dataInicioFilter, dataTerminoFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOccurrences.length / pageSize) || 1;
  const paginatedOccurrences = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOccurrences.slice(start, start + pageSize);
  }, [filteredOccurrences, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Código ID',
      'Matrícula',
      'Nome do Servidor',
      'Cargo',
      'Secretaria',
      'Tipo',
      'Data de Afastamento',
      'Previsão de Retorno',
      'Total de Dias',
      'Dias Pagos',
      'CID-10',
      'Médico Perito',
      'CRM',
      'Status',
      'Data de Cadastro',
    ];
    const rows = filteredOccurrences.map(o => [
      o.id,
      o.matricula,
      o.employee_nome || '',
      o.employee_cargo || '',
      o.employee_secretaria || '',
      o.tipo,
      formatarDataBR(o.data_inicio),
      formatarDataBR(o.data_termino),
      o.quantidade_dias,
      calcularDiasPagos(o.quantidade_dias),
      o.cid || '',
      o.medico_perito,
      o.crm,
      o.status,
      formatarDataBR(o.created_at),
    ]);
    exportarCSV('IPME_Licencas_e_Readaptacoes_Eusebio', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Acompanhamento de Licenças Saúde & Readaptações
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Junta Médica Pericial Oficial · Instituto de Previdência do Município de Eusébio (IPME).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenExecutiveReport && (
            <button
              onClick={onOpenExecutiveReport}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Emitir Relatório Gerencial em PDF Paisagem (Landscape)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
              <span>Relatório Executivo PDF</span>
            </button>
          )}

          {onOpenAuditTrail && (
            <button
              onClick={onOpenAuditTrail}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Acessar a Trilha de Auditoria e Histórico Completo de Alterações"
            >
              <History className="w-3.5 h-3.5 text-purple-700" />
              <span>Histórico / Trilha</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            title="Exportar dados para Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          {onClearAllOccurrences && occurrences.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Excluir todas as licenças de teste mantendo o cadastro de servidores intacto"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Limpar Licenças de Teste</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewOccurrence()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Ocorrência</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Global Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ID, Servidor, Cargo, Matrícula, CID ou Perito..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tipo Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedTipo}
              onChange={e => {
                setSelectedTipo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
            >
              <option value="ALL">Todos os Tipos de Ocorrência</option>
              <option value="Licença Saúde">Licença Saúde</option>
              <option value="Readaptação">Readaptação Funcional</option>
              <option value="Licença Definitiva">Licença Definitiva</option>
              <option value="Licença Maternidade">Licença Maternidade</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Ativa">Ativa</option>
              <option value="Prorrogada">Prorrogada</option>
              <option value="Concluída">Concluída</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          {/* Date range filters */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={dataInicioFilter}
              onChange={e => {
                setDataInicioFilter(e.target.value);
                setCurrentPage(1);
              }}
              title="Filtrar por data de início a partir de"
              className="w-full py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-1.5">
            <input
              type="date"
              value={dataTerminoFilter}
              onChange={e => {
                setDataTerminoFilter(e.target.value);
                setCurrentPage(1);
              }}
              title="Filtrar por data de término até"
              className="w-full py-2 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800"
            />
            {(dataInicioFilter || dataTerminoFilter) && (
              <button
                onClick={() => {
                  setDataInicioFilter('');
                  setDataTerminoFilter('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                title="Limpar filtro de datas"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Counts strip */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Mostrando <span className="font-semibold text-slate-900 font-mono tabular-nums">{filteredOccurrences.length}</span> registros de afastamento
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{occurrences.filter(o => o.status === 'Ativa').length} Ativas</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>{occurrences.filter(o => o.status === 'Prorrogada').length} Prorrogadas</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>{occurrences.filter(o => o.status === 'Concluída').length} Concluídas</span>
            </span>
          </div>
        </div>
      </div>

      {/* Occurrences Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap">Código ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Servidor</th>
                <th className="py-3 px-4 whitespace-nowrap">Cargo / Função</th>
                <th className="py-3 px-4 whitespace-nowrap">Secretaria</th>
                <th className="py-3 px-4 whitespace-nowrap">Tipo</th>
                <th className="py-3 px-4 whitespace-nowrap">Data Afastamento</th>
                <th className="py-3 px-4 whitespace-nowrap">Prev. Retorno</th>
                <th className="py-3 px-4 text-center whitespace-nowrap" title="Dias pagos pelo IPME (os primeiros 15 dias são assumidos pela Prefeitura)">Dias Pagos</th>
                <th className="py-3 px-4 whitespace-nowrap">CID-10</th>
                <th className="py-3 px-4 whitespace-nowrap">Perito Oficial</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedOccurrences.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-medium text-slate-600">Nenhum afastamento ou readaptação encontrado.</p>
                    <p className="text-xs text-slate-400 mt-1">Ajuste os filtros de status, tipo ou datas.</p>
                  </td>
                </tr>
              ) : (
                paginatedOccurrences.map(occ => {
                  return (
                    <tr key={occ.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-mono">
                          {occ.id}
                        </span>
                      </td>

                      {/* Servidor (Matrícula + Nome sem quebra) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            {occ.matricula}
                          </span>
                          <button
                            onClick={() => onViewEmployeeDetailByMatricula(occ.matricula)}
                            className="font-semibold text-slate-900 hover:text-emerald-700 text-left transition-colors whitespace-nowrap"
                            title="Ver prontuário do servidor"
                          >
                            {occ.employee_nome || occ.matricula}
                          </button>
                        </div>
                      </td>

                      {/* Cargo / Função (Coluna Separada) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800 text-xs">
                          {occ.employee_cargo || 'Servidor Municipal'}
                        </span>
                      </td>

                      {/* Secretaria (Coluna Própria) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700 text-xs" title={occ.employee_secretaria}>
                          {occ.employee_secretaria || '-'}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
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
                      </td>

                      {/* Data Afastamento */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-800 font-medium text-xs">
                        {formatarDataBR(occ.data_inicio)}
                      </td>

                      {/* Data Previsão Retorno */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-800 font-medium text-xs">
                        {occ.tipo === 'Licença Definitiva' ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-purple-900 text-xs">Definitiva</span>
                            <span className="text-[10px] text-purple-700 font-mono">
                              Concessão: {formatarDataBR(occ.data_concessao || occ.data_inicio)}
                            </span>
                          </div>
                        ) : (
                          formatarDataBR(occ.data_termino)
                        )}
                      </td>

                      {/* Dias Pagos (15 primeiros dias assumidos pela prefeitura) */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        {occ.quantidade_dias > 15 ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs tabular-nums shadow-2xs">
                              {calcularDiasPagos(occ.quantidade_dias)} {calcularDiasPagos(occ.quantidade_dias) === 1 ? 'dia' : 'dias'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5" title={`Total de afastamento: ${occ.quantidade_dias} dias (15 dias prefeitura + ${calcularDiasPagos(occ.quantidade_dias)} dias pagos IPME)`}>
                              total: {occ.quantidade_dias}d
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs tabular-nums">
                              0 dias
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium mt-0.5" title="Afastamento de até 15 dias assumido integralmente pela Prefeitura">
                              Prefeitura (≤15d)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* CID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800">
                          {occ.cid ? occ.cid.split(' - ')[0] : '-'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[140px]" title={occ.cid}>
                          {occ.cid && occ.cid.includes(' - ') ? occ.cid.split(' - ')[1] : 'Sigiloso'}
                        </div>
                      </td>

                      {/* Perito & CRM */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[150px]">
                          {occ.medico_perito}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {occ.crm}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {occ.status === 'Ativa' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Ativa
                          </span>
                        )}
                        {occ.status === 'Prorrogada' && (
                          <button
                            type="button"
                            onClick={() => setHistoryModalOccurrence(occ)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-colors shadow-2xs group/btn cursor-pointer"
                            title="Clique para ver o histórico detalhado de prorrogações deste afastamento"
                          >
                            <History className="w-3 h-3 text-purple-600 group-hover/btn:rotate-[-45deg] transition-transform" />
                            <span>Prorrogada ({occ.prorrogacoes?.length || 1}x)</span>
                          </button>
                        )}
                        {occ.status === 'Concluída' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            Concluída
                          </span>
                        )}
                        {occ.status === 'Cancelada' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                            Cancelada
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Print Certificate Sheet */}
                          <button
                            onClick={() => onPrintOccurrence(occ)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Visualizar e Imprimir Laudo Pericial Oficial"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* View Extension and Modification History */}
                          <button
                            onClick={() => setHistoryModalOccurrence(occ)}
                            className="p-1.5 text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                            title="Ver Histórico Cronológico, Prorrogações e Trilha desta Ocorrência"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Quick Lifecycle Controls */}
                          {(occ.status === 'Ativa' || occ.status === 'Prorrogada') && (
                            <>
                              {occ.tipo !== 'Licença Definitiva' && (
                                <button
                                  onClick={() => onOpenConverterDefinitiva(occ)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Mecanismo de Transformação: Converter esta licença em Licença Definitiva por incapacidade permanente"
                                >
                                  <FileBadge className="w-3.5 h-3.5 text-purple-700" />
                                  <span>Tornar Definitiva</span>
                                </button>
                              )}
                              {occ.tipo !== 'Licença Definitiva' && (
                                <button
                                  onClick={() => onOpenProrrogar(occ)}
                                  className="px-2 py-1 text-[11px] font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors cursor-pointer"
                                  title="Homologar prorrogação com novo período"
                                >
                                  Prorrogar
                                </button>
                              )}
                              <button
                                onClick={() => onOpenConcluir(occ)}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors cursor-pointer"
                                title="Concluir licença após perícia de retorno (restaura servidor para Ativo)"
                              >
                                Concluir
                              </button>
                            </>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => onOpenEditOccurrence(occ)}
                            className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                            title="Editar dados da ocorrência"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Cancel */}
                          {occ.status !== 'Cancelada' && occ.status !== 'Concluída' && (
                            <button
                              onClick={() => onOpenCancelar(occ)}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                              title="Registrar cancelamento da licença"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (Admin only) */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => setOccurrenceToDelete(occ)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Excluir ocorrência (Requer Administrador)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Página <span className="font-semibold text-slate-900 font-mono">{currentPage}</span> de{' '}
              <span className="font-semibold text-slate-900 font-mono">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prorrogações History Modal */}
      <ProrrogacoesHistoryModal
        isOpen={!!historyModalOccurrence}
        occurrence={historyModalOccurrence}
        onClose={() => setHistoryModalOccurrence(null)}
        onOpenPrint={onPrintOccurrence}
        onOpenNewProrrogacao={onOpenProrrogar}
        canEdit={userRole === 'admin' || userRole === 'operator'}
      />

      {/* Modal In-App: Confirmação de Exclusão de Ocorrência Individual */}
      {occurrenceToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold">Confirmar Exclusão de Ocorrência</h3>
              </div>
              <button
                onClick={() => setOccurrenceToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Esta ação removerá o afastamento definitivamente.</p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    O servidor vinculado terá seu status recalculado automaticamente (retornando a Ativo se não possuir outras licenças).
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Registro:</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">Nº {occurrenceToDelete.id}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Servidor:</span>
                  <span className="font-bold text-slate-900">{occurrenceToDelete.employee_nome} ({occurrenceToDelete.matricula})</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Tipo de Afastamento:</span>
                  <span className="font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{occurrenceToDelete.tipo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Período:</span>
                  <span className="font-mono text-slate-800">{formatarDataBR(occurrenceToDelete.data_inicio)} até {formatarDataBR(occurrenceToDelete.data_termino)} ({occurrenceToDelete.quantidade_dias} dias)</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOccurrenceToDelete(null)}
                  disabled={isProcessingDelete}
                  className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const id = occurrenceToDelete.id;
                    setIsProcessingDelete(true);
                    try {
                      await onDeleteOccurrence(id);
                      setOccurrenceToDelete(null);
                    } finally {
                      setIsProcessingDelete(false);
                    }
                  }}
                  disabled={isProcessingDelete}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessingDelete ? 'Excluindo...' : 'Excluir Definitivamente'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal In-App: Confirmação de Limpeza Geral de Licenças de Teste */}
      {isClearAllModalOpen && onClearAllOccurrences && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold">Limpar Todas as Licenças de Teste?</h3>
              </div>
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Seus servidores cadastrados serão PRESERVADOS!</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Esta ação apagará apenas os registros de licenças/afastamentos simulados ({occurrences.length} registros).
                    Todos os servidores continuarão salvos no sistema e retornarão automaticamente ao status <strong>Ativo</strong>, prontos para você cadastrar as licenças reais do zero.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(false)}
                  disabled={isProcessingDelete}
                  className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsProcessingDelete(true);
                    try {
                      await onClearAllOccurrences();
                      setIsClearAllModalOpen(false);
                    } finally {
                      setIsProcessingDelete(false);
                    }
                  }}
                  disabled={isProcessingDelete}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isProcessingDelete ? 'Limpando...' : `Limpar ${occurrences.length} Licenças`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
