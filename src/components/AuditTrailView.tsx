import React, { useState, useMemo } from 'react';
import { AuditLog } from '../types/index.ts';
import { formatarDataHoraBR, exportarCSV } from '../utils/validation.ts';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  ShieldCheck, 
  User, 
  FileText, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  X
} from 'lucide-react';

interface AuditTrailViewProps {
  logs: AuditLog[];
  loading: boolean;
  onRefresh: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  logs,
  loading,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (selectedEntity !== 'ALL' && l.entity_type !== selectedEntity) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchDetails = l.details.toLowerCase().includes(q);
        const matchEntityId = l.entity_id.toLowerCase().includes(q);
        const matchUser = l.changed_by.toLowerCase().includes(q);
        const matchAction = l.action.toLowerCase().includes(q);
        return matchDetails || matchEntityId || matchUser || matchAction;
      }
      return true;
    });
  }, [logs, searchTerm, selectedEntity]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleExportCSV = () => {
    const headers = [
      'Data / Hora',
      'Tipo de Entidade',
      'Identificador (ID / Matrícula)',
      'Ação',
      'Descrição Detalhada do Evento',
      'Usuário Responsável',
      'Papel (Role)',
    ];
    const rows = filteredLogs.map(l => [
      formatarDataHoraBR(l.timestamp),
      l.entity_type,
      l.entity_id,
      l.action,
      l.details,
      l.changed_by,
      l.user_role,
    ]);
    exportarCSV('IPME_Trilha_Auditoria_Compliance', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            <span>Trilha de Auditoria & Conformidade Previdenciária</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro imutável de todas as inserções, homologações, prorrogações e alterações cadastrais (TCM-CE / Compliance).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            title="Atualizar registros de auditoria"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            title="Exportar trilha de auditoria para planilha"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar Relatório de Auditoria</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Global Search */}
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição da alteração, matrícula, ID de ocorrência ou usuário..."
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

          {/* Entity Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedEntity}
              onChange={e => {
                setSelectedEntity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
            >
              <option value="ALL">Todas as Entidades do Sistema</option>
              <option value="occurrence">Afastamentos (Licenças & Readaptações)</option>
              <option value="employee">Servidores Ativos</option>
              <option value="user">Usuários e Permissões</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Total de <span className="font-semibold text-slate-900 font-mono tabular-nums">{filteredLogs.length}</span> eventos auditados
          </div>
          <div className="text-[11px] text-purple-700 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Assinatura Digital & Carimbo Temporal Ativos</span>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Data / Carimbo</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">ID / Referência</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Detalhamento do Evento</th>
                <th className="py-3 px-4">Operador / Autor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-medium text-slate-600">Nenhum evento registrado com os filtros informados.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatarDataHoraBR(log.timestamp)}
                      </td>

                      {/* Entity Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          log.entity_type === 'occurrence' 
                            ? 'bg-amber-100 text-amber-800' 
                            : log.entity_type === 'employee'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {log.entity_type === 'occurrence' ? 'Licença/Readaptação' : log.entity_type === 'employee' ? 'Servidor' : 'Usuário'}
                        </span>
                      </td>

                      {/* Entity ID */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {log.entity_id}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          log.action === 'CREATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800'
                            : log.action === 'PRORROGAR'
                            ? 'bg-purple-100 text-purple-800'
                            : log.action === 'CONCLUIR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'CANCELAR'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-800 max-w-md">
                        {log.details}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {log.changed_by}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">
                          Papel: {log.user_role}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
    </div>
  );
};
