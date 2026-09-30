import React, { useState, useMemo } from 'react';
import { Doctor, UserRole, DoctorVinculo } from '../types/index.ts';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter, 
  Award, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Users, 
  AlertCircle,
  Crown,
  Star,
  Check,
  X
} from 'lucide-react';

interface DoctorsViewProps {
  doctors: Doctor[];
  userRole: UserRole;
  onRefresh: () => void;
  onOpenNewDoctor: () => void;
  onEditDoctor: (doc: Doctor) => void;
  onDeleteDoctor: (id: string) => Promise<void>;
  onToggleStatusDoctor: (id: string) => Promise<void>;
  onSetDiretorDoctor?: (id: string) => Promise<void>;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors,
  userRole,
  onRefresh,
  onOpenNewDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onToggleStatusDoctor,
  onSetDiretorDoctor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [vinculoFilter, setVinculoFilter] = useState<'ALL' | DoctorVinculo>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [directorConfirmDoctor, setDirectorConfirmDoctor] = useState<Doctor | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessingDirector, setIsProcessingDirector] = useState(false);

  // Current active Director
  const currentDirector = useMemo(() => {
    return doctors.find(d => d.is_diretor && d.ativo) || doctors.find(d => d.is_diretor);
  }, [doctors]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doc => {
      // Status
      if (statusFilter === 'ACTIVE' && !doc.ativo) return false;
      if (statusFilter === 'INACTIVE' && doc.ativo) return false;

      // Vinculo
      if (vinculoFilter !== 'ALL' && doc.vinculo !== vinculoFilter) return false;

      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesNome = doc.nome.toLowerCase().includes(q);
        const matchesCrm = doc.crm.toLowerCase().includes(q);
        const matchesEsp = doc.especialidade ? doc.especialidade.toLowerCase().includes(q) : false;
        const matchesVinculo = doc.vinculo ? doc.vinculo.toLowerCase().includes(q) : false;
        if (!matchesNome && !matchesCrm && !matchesEsp && !matchesVinculo) return false;
      }

      return true;
    });
  }, [doctors, searchTerm, statusFilter, vinculoFilter]);

  const stats = useMemo(() => {
    const total = doctors.length;
    const ativos = doctors.filter(d => d.ativo).length;
    const inativos = total - ativos;
    const efetivos = doctors.filter(d => d.vinculo === 'Efetivo').length;
    const comissionados = doctors.filter(d => d.vinculo === 'Comissionado').length;
    const temporarios = doctors.filter(d => d.vinculo === 'Temporário').length;
    return { total, ativos, inativos, efetivos, comissionados, temporarios };
  }, [doctors]);

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await onDeleteDoctor(id);
      setDeleteConfirmId(null);
    } catch (err) {
      setActionError((err as Error).message || 'Erro ao excluir médico.');
    }
  };

  const handleToggle = async (id: string) => {
    setActionError(null);
    try {
      await onToggleStatusDoctor(id);
    } catch (err) {
      setActionError((err as Error).message || 'Erro ao alterar status do médico.');
    }
  };

  const handleConfirmSetDirector = async () => {
    if (!directorConfirmDoctor || !onSetDiretorDoctor) return;
    setActionError(null);
    setIsProcessingDirector(true);
    try {
      await onSetDiretorDoctor(directorConfirmDoctor.id);
      setDirectorConfirmDoctor(null);
    } catch (err) {
      setActionError((err as Error).message || 'Erro ao definir médico diretor.');
    } finally {
      setIsProcessingDirector(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Junta Médica Pericial · IPME</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
            Cadastro de Médicos Peritos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie o corpo clínico pericial homologado para emissão de laudos de licenças e readaptações funcionais.
          </p>
        </div>

        <button
          onClick={onOpenNewDoctor}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Médico</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{actionError}</span>
          </div>
          <button 
            onClick={() => setActionError(null)}
            className="text-red-700 hover:text-red-900 text-xs font-bold underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Médicos */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Cadastrados
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {stats.total}
              </span>
              <span className="text-xs text-slate-500">médicos</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        {/* Médico Diretor Oficial */}
        <div className="bg-linear-to-br from-amber-50 to-orange-50/40 rounded-xl p-4 border border-amber-200 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Médico Diretor da Junta
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-bold text-slate-900 block truncate" title={currentDirector?.nome}>
                {currentDirector?.nome || 'Nenhum definido'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono text-amber-900 font-semibold">
                  {currentDirector?.crm || 'Pendente'}
                </span>
                {currentDirector?.vinculo && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                    {currentDirector.vinculo}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        {/* Médicos Ativos */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
              Peritos Ativos
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-950 tabular-nums">
                {stats.ativos}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">
                habilitados
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Distribuição por Vínculo */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Vínculos Funcionais
            </span>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <span className="text-sky-800 font-semibold bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                {stats.efetivos} Efetivos
              </span>
              <span className="text-purple-800 font-semibold bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                {stats.comissionados} Comiss.
              </span>
              <span className="text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                {stats.temporarios} Temp.
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CRM, especialidade ou vínculo..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />
        </div>

        {/* Vinculo Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs shrink-0 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Vínculo:</span>
          {(['ALL', 'Efetivo', 'Comissionado', 'Temporário'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVinculoFilter(v)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer text-[11px] whitespace-nowrap ${
                vinculoFilter === v
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {v === 'ALL' ? 'Todos' : v}
            </button>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ativos ({stats.ativos})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'INACTIVE'
                ? 'bg-slate-700 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inativos ({stats.inativos})
          </button>
        </div>

      </div>

      {/* Table of Doctors */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-900 text-white font-semibold text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-3 w-16 text-center">ID</th>
              <th className="py-3 px-4">Médico Perito Oficial</th>
              <th className="py-3 px-3">Vínculo</th>
              <th className="py-3 px-4">Número CRM</th>
              <th className="py-3 px-4">Especialidade / Atuação</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Nenhum médico encontrado</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {searchTerm ? 'Tente ajustar os termos da busca.' : 'Cadastre o primeiro médico perito clicando no botão acima.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredDoctors.map(doc => {
                const isDeleting = deleteConfirmId === doc.id;
                const isDiretor = Boolean(doc.is_diretor);

                return (
                  <tr key={doc.id} className={`hover:bg-slate-50/80 transition-colors ${
                    isDiretor ? 'bg-amber-50/20' : ''
                  }`}>
                    {/* ID Sequencial */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs">
                        #{doc.id}
                      </span>
                    </td>

                    {/* Médico */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shrink-0 border relative ${
                          isDiretor 
                            ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-400/40' 
                            : 'bg-emerald-100 border-emerald-200 text-emerald-800'
                        }`}>
                          {doc.nome.replace('Dr. ', '').replace('Dra. ', '').charAt(0)}
                          {isDiretor && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-2xs">
                              <Crown className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 block text-xs">
                              {doc.nome}
                            </span>
                            {isDiretor && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                                <Crown className="w-3 h-3 text-amber-600" />
                                <span>Médico Diretor</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {isDiretor ? 'Responsável Técnico Oficial · Assina Relatório Executivo' : 'Médico Perito Oficial do IPME'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Vínculo */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        doc.vinculo === 'Efetivo'
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : doc.vinculo === 'Comissionado'
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {doc.vinculo || 'Efetivo'}
                      </span>
                    </td>

                    {/* CRM */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-xs">
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>{doc.crm}</span>
                      </div>
                    </td>

                    {/* Especialidade */}
                    <td className="py-3 px-4">
                      <span className="text-slate-700 block text-xs font-medium">
                        {doc.especialidade || 'Medicina Geral / Perícia'}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(doc.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors cursor-pointer border ${
                          doc.ativo
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Clique para alternar o status Ativo/Inativo"
                      >
                        {doc.ativo ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isDeleting ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[11px] text-red-600 font-medium">Excluir médico?</span>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {/* Tornar Diretor Button (Admin only) */}
                          {userRole === 'admin' && onSetDiretorDoctor && (
                            isDiretor ? (
                              <span 
                                className="p-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg inline-flex items-center gap-1 text-[10px] font-bold"
                                title="Este médico é o Diretor Oficial atual"
                              >
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                                <span className="hidden xl:inline">Diretor</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => setDirectorConfirmDoctor(doc)}
                                className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                                title="Definir este profissional como Médico Diretor da Junta"
                              >
                                <Crown className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Tornar Diretor</span>
                              </button>
                            )
                          )}

                          <button
                            onClick={() => onEditDoctor(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar cadastro do médico"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {userRole === 'admin' && (
                            <button
                              onClick={() => setDeleteConfirmId(doc.id)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir médico do cadastro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal In-App: Confirmação de Designação de Médico Diretor */}
      {directorConfirmDoctor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Definir Médico Diretor Oficial</h3>
              </div>
              <button
                onClick={() => setDirectorConfirmDoctor(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Responsabilidade Técnica e Assinatura Oficial</p>
                  <p className="text-[11px] text-amber-800 mt-1">
                    Ao confirmar, este profissional passará a ser o <strong>Diretor Médico da Junta Pericial do IPME</strong>. Seu nome, CRM e cargo constarão automaticamente no campo de assinatura do <strong>Relatório Executivo</strong> e nos atos periciais oficiais.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Médico:</span>
                  <span className="font-bold text-slate-900">{directorConfirmDoctor.nome}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Registro CRM:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">{directorConfirmDoctor.crm}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Vínculo:</span>
                  <span className="font-semibold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">{directorConfirmDoctor.vinculo || 'Efetivo'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Especialidade:</span>
                  <span className="text-slate-700">{directorConfirmDoctor.especialidade || 'Perícia Médica Oficial'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDirectorConfirmDoctor(null)}
                  disabled={isProcessingDirector}
                  className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSetDirector}
                  disabled={isProcessingDirector}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-4 h-4" />
                  <span>{isProcessingDirector ? 'Definindo...' : 'Confirmar Diretor(a)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
