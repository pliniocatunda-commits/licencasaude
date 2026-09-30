import React, { useState, useMemo } from 'react';
import { Secretaria, AppUser } from '../types/index.ts';
import { 
  Building2, 
  Plus, 
  Search, 
  Download, 
  Edit3, 
  Trash2, 
  Users, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface SecretariasViewProps {
  secretarias: Secretaria[];
  currentUser: AppUser;
  onOpenNewSecretaria: () => void;
  onEditSecretaria: (sec: Secretaria) => void;
  onDeleteSecretaria: (id: string) => Promise<void>;
  onToggleStatusSecretaria: (sec: Secretaria) => Promise<void>;
  onFilterEmployeesBySecretaria: (secName: string) => void;
}

export const SecretariasView: React.FC<SecretariasViewProps> = ({
  secretarias,
  currentUser,
  onOpenNewSecretaria,
  onEditSecretaria,
  onDeleteSecretaria,
  onToggleStatusSecretaria,
  onFilterEmployeesBySecretaria,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filtered Secretarias
  const filteredSecretarias = useMemo(() => {
    return secretarias.filter(s => {
      const matchesSearch = 
        s.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.secretario && s.secretario.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = 
        statusFilter === 'all' ? true :
        statusFilter === 'active' ? s.ativa :
        !s.ativa;

      return matchesSearch && matchesStatus;
    });
  }, [secretarias, searchTerm, statusFilter]);

  // Summary Metrics
  const totalSecretarias = secretarias.length;
  const ativasCount = secretarias.filter(s => s.ativa).length;
  const inativasCount = totalSecretarias - ativasCount;
  const totalServidoresLotados = secretarias.reduce((acc, curr) => acc + (curr.servidores_count || 0), 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Sigla', 'Nome da Secretaria', 'Titular / Responsável', 'Email', 'Telefone', 'Endereço', 'Status', 'Servidores Lotados'];
    const rows = filteredSecretarias.map(s => [
      `"${s.sigla}"`,
      `"${s.nome}"`,
      `"${s.secretario || '-'}"`,
      `"${s.email || '-'}"`,
      `"${s.telefone || '-'}"`,
      `"${s.endereco || '-'}"`,
      s.ativa ? '"Ativa"' : '"Inativa"',
      s.servidores_count || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tabela_secretarias_ipme_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await onDeleteSecretaria(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir secretaria');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Cadastros Básicos</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Tabela de Secretarias & Órgãos</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Cadastro Geral de Secretarias</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie os órgãos da Prefeitura Municipal de Eusébio para lotação de servidores e controle de licenças
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            title="Exportar planilha de secretarias em CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewSecretaria}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Secretaria</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total de Secretarias</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{totalSecretarias}</p>
          <span className="text-[11px] text-slate-500">Órgãos cadastrados</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Secretarias Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2 font-mono">{ativasCount}</p>
          <span className="text-[11px] text-emerald-600">Disponíveis para lotação</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Secretarias Inativas</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-700 mt-2 font-mono">{inativasCount}</p>
          <span className="text-[11px] text-slate-500">Arquivadas / sem lotação nova</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-sky-700">Servidores Lotados</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-sky-700 mt-2 font-mono">{totalServidoresLotados}</p>
          <span className="text-[11px] text-sky-600">Vínculos computados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por sigla (SME, SMS...), nome do órgão, titular ou e-mail..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Status:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({totalSecretarias})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ativas ({ativasCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'inactive'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inativas ({inativasCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secretarias Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Sigla</th>
                <th className="py-3 px-4">Secretaria / Órgão</th>
                <th className="py-3 px-4">Titular / Secretário(a)</th>
                <th className="py-3 px-4">Contatos</th>
                <th className="py-3 px-4 text-center">Servidores</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSecretarias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma secretaria encontrada com os critérios pesquisados.
                  </td>
                </tr>
              ) : (
                filteredSecretarias.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sigla */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-800 border border-slate-300 font-mono tracking-wider">
                        {sec.sigla}
                      </span>
                    </td>

                    {/* Nome Completo & Endereço */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {sec.nome}
                      </div>
                      {sec.endereco && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                          {sec.endereco}
                        </div>
                      )}
                    </td>

                    {/* Titular */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-700 font-medium">
                        {sec.secretario || <span className="text-slate-400 italic">Não informado</span>}
                      </span>
                    </td>

                    {/* Contatos (Email & Telefone) */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {sec.email && (
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{sec.email}</span>
                          </div>
                        )}
                        {sec.telefone && (
                          <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{sec.telefone}</span>
                          </div>
                        )}
                        {!sec.email && !sec.telefone && (
                          <span className="text-slate-400 italic text-[11px]">Sem contato</span>
                        )}
                      </div>
                    </td>

                    {/* Servidores Lotados */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onFilterEmployeesBySecretaria(sec.nome)}
                        title="Ver servidores lotados nesta secretaria"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
                      >
                        <Users className="w-3 h-3" />
                        <span>{sec.servidores_count || 0}</span>
                        <ArrowRight className="w-3 h-3 opacity-60" />
                      </button>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onToggleStatusSecretaria(sec)}
                        title={`Clique para ${sec.ativa ? 'desativar' : 'ativar'}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                          sec.ativa
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {sec.ativa ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Ativa</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>Inativa</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditSecretaria(sec)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar dados da secretaria"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {currentUser.role === 'admin' && (
                          <>
                            {deleteConfirmId === sec.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in">
                                <button
                                  onClick={() => handleDelete(sec.id)}
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                                >
                                  {actionLoading ? '...' : 'Confirmar'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-1 text-slate-500 hover:bg-slate-200 rounded text-[10px]"
                                >
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(sec.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir secretaria (apenas Administrador)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
