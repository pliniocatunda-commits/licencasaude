import React, { useState, useMemo, useEffect } from 'react';
import { Employee, UserRole, Secretaria } from '../types/index.ts';
import { 
  formatarCPF, 
  validarCPF, 
  formatarTelefone, 
  SECRETARIAS_MUNICIPAIS, 
  exportarCSV,
  formatarDataBR
} from '../utils/validation.ts';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  FilePlus, 
  CheckCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Building,
  Briefcase,
  Users,
  X
} from 'lucide-react';

interface EmployeesViewProps {
  employees: Employee[];
  userRole: UserRole;
  onRefresh: () => void;
  onOpenEmployeeModal: (employee?: Employee) => void;
  onViewEmployeeDetail: (employee: Employee) => void;
  onOpenNewOccurrenceForEmployee: (matricula: string) => void;
  onDeleteEmployee: (matricula: string) => void;
  secretariasList?: Secretaria[];
  initialSecretariaFilter?: string;
  onClearSecretariaFilter?: () => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  userRole,
  onRefresh,
  onOpenEmployeeModal,
  onViewEmployeeDetail,
  onOpenNewOccurrenceForEmployee,
  onDeleteEmployee,
  secretariasList = [],
  initialSecretariaFilter,
  onClearSecretariaFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecretaria, setSelectedSecretaria] = useState(initialSecretariaFilter || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 8;

  useEffect(() => {
    if (initialSecretariaFilter) {
      setSelectedSecretaria(initialSecretariaFilter);
      setCurrentPage(1);
    }
  }, [initialSecretariaFilter]);

  // Compute available secretarias names
  const secretariaOptions = useMemo(() => {
    if (secretariasList && secretariasList.length > 0) {
      return secretariasList.map(s => s.nome);
    }
    return SECRETARIAS_MUNICIPAIS;
  }, [secretariasList]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Secretaria filter
      if (selectedSecretaria !== 'ALL' && !emp.secretaria.toLowerCase().includes(selectedSecretaria.toLowerCase())) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'ALL' && emp.status !== selectedStatus) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const cleanQ = q.replace(/\D/g, '');
        const matchMatricula = emp.matricula.toLowerCase().includes(q);
        const matchNome = emp.nome.toLowerCase().includes(q);
        const matchCpf = cleanQ && emp.cpf.replace(/\D/g, '').includes(cleanQ);
        const matchCargo = emp.cargo.toLowerCase().includes(q);
        const matchSetor = emp.setor ? emp.setor.toLowerCase().includes(q) : false;
        return matchMatricula || matchNome || matchCpf || matchCargo || matchSetor;
      }
      return true;
    });
  }, [employees, searchTerm, selectedSecretaria, selectedStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Matrícula',
      'Nome Completo',
      'CPF',
      'Telefone',
      'Secretaria de Lotação',
      'Cargo',
      'Status Atual',
      'Data de Cadastro',
    ];
    const rows = filteredEmployees.map(e => [
      e.matricula,
      e.nome,
      e.cpf,
      e.telefone,
      e.secretaria,
      e.cargo,
      e.status,
      formatarDataBR(e.created_at),
    ]);
    exportarCSV('IPME_Servidores_Ativos_Eusebio', headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cadastro de Servidores Ativos (IPME)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento cadastral, vinculação funcional e controle de status pericial.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
            title="Exportar listagem em formato CSV para Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => onOpenEmployeeModal()}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Servidor</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Global Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por Matrícula, Nome, CPF ou Cargo..."
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

          {/* Secretaria Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedSecretaria}
              onChange={e => {
                setSelectedSecretaria(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            >
              <option value="ALL">Todas as Secretarias ({employees.length})</option>
              {secretariaOptions.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Ativo">Apenas Ativos</option>
              <option value="Licenciado">Apenas Licença Saúde</option>
              <option value="Readaptado">Apenas Readaptados</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Counts */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Mostrando <span className="font-semibold text-slate-900 font-mono tabular-nums">{filteredEmployees.length}</span> servidores encontrados
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{employees.filter(e => e.status === 'Ativo').length} Ativos</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{employees.filter(e => e.status === 'Licenciado').length} Licenciados</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>{employees.filter(e => e.status === 'Readaptado').length} Readaptados</span>
            </span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Matrícula</th>
                <th className="py-3 px-4">Servidor / Nome</th>
                <th className="py-3 px-4">CPF</th>
                <th className="py-3 px-4">Secretaria de Lotação</th>
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    {employees.length === 0 ? (
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="text-base font-semibold text-slate-800">Cadastro de Servidores Limpo</p>
                        <p className="text-xs text-slate-500">
                          O banco de servidores está pronto para receber seus cadastros reais para testes.
                        </p>
                        <button
                          onClick={() => onOpenEmployeeModal()}
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Cadastrar Primeiro Servidor
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-600">Nenhum servidor encontrado com os filtros selecionados.</p>
                        <p className="text-xs text-slate-400 mt-1">Experimente alterar os termos de busca ou filtros de secretaria.</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map(emp => {
                  return (
                    <tr key={emp.matricula} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Matrícula (PK) */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {emp.matricula}
                      </td>

                      {/* Nome & Contato */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {emp.nome}
                        </div>
                        {emp.telefone && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {formatarTelefone(emp.telefone)}
                          </div>
                        )}
                      </td>

                      {/* CPF */}
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {formatarCPF(emp.cpf)}
                      </td>

                      {/* Secretaria de Lotação */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[220px]" title={emp.secretaria}>
                          {emp.secretaria.split(' - ')[0] || emp.secretaria}
                        </div>
                        {emp.setor && emp.setor !== 'Geral' && (
                          <div className="text-[11px] text-slate-500 truncate max-w-[220px]" title={emp.setor}>
                            {emp.setor}
                          </div>
                        )}
                      </td>

                      {/* Cargo */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {emp.cargo}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {emp.status === 'Ativo' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Ativo
                          </span>
                        )}
                        {emp.status === 'Licenciado' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Licença Saúde
                          </span>
                        )}
                        {emp.status === 'Readaptado' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            Readaptado
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail & History */}
                          <button
                            onClick={() => onViewEmployeeDetail(emp)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Visualizar prontuário e histórico completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Add Leave / Readaptação */}
                          <button
                            onClick={() => onOpenNewOccurrenceForEmployee(emp.matricula)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                            title="Lançar licença médica ou readaptação para este servidor"
                          >
                            <FilePlus className="w-4 h-4" />
                          </button>

                          {/* Edit Employee */}
                          <button
                            onClick={() => onOpenEmployeeModal(emp)}
                            className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
                            title="Editar cadastro do servidor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete (Admin only) */}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => setEmployeeToDelete(emp)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Excluir servidor (Requer permissão de Administrador)"
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
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold">Excluir Servidor</h3>
              </div>
              <button
                onClick={() => setEmployeeToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Tem certeza que deseja excluir o cadastro deste servidor?</p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Todas as ocorrências e registros periciais associados a este servidor também serão desvinculados/removidos. Esta ação não poderá ser desfeita.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Nome:</span>
                  <span className="font-bold text-slate-900">{employeeToDelete.nome}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Matrícula:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">{employeeToDelete.matricula}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Cargo:</span>
                  <span className="font-semibold text-slate-800">{employeeToDelete.cargo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Secretaria:</span>
                  <span className="text-slate-700 text-right max-w-[200px] truncate">{employeeToDelete.secretaria}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEmployeeToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const matricula = employeeToDelete.matricula;
                    setIsDeleting(true);
                    try {
                      await onDeleteEmployee(matricula);
                      setEmployeeToDelete(null);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Excluindo...' : 'Excluir Servidor'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
