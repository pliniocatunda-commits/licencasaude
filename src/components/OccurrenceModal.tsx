import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Occurrence, OccurrenceType, OccurrenceStatus, Employee, Doctor } from '../types/index.ts';
import { 
  calcularQuantidadeDias, 
  calcularDiasPagos,
  CID_CATALOG 
} from '../utils/validation.ts';
import { 
  X, 
  Save, 
  FileText, 
  Calendar, 
  Stethoscope, 
  Paperclip, 
  AlertCircle, 
  HeartPulse, 
  RefreshCw, 
  Baby,
  FileBadge,
  Search, 
  Upload,
  User,
  Check,
  Building2,
  Lock
} from 'lucide-react';

interface OccurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (occurrenceData: Partial<Occurrence>) => Promise<void>;
  employees: Employee[];
  doctors?: Doctor[];
  initialOccurrence?: Occurrence | null;
  preselectedMatricula?: string;
}

export const OccurrenceModal: React.FC<OccurrenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employees,
  doctors = [],
  initialOccurrence,
  preselectedMatricula,
}) => {
  const [matricula, setMatricula] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  const [tipo, setTipo] = useState<OccurrenceType>('Licença Saúde');
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [quantidadeDias, setQuantidadeDias] = useState(0);
  const [cidSelect, setCidSelect] = useState('');
  const [cidCustom, setCidCustom] = useState('');
  const [medicoPerito, setMedicoPerito] = useState('');
  const [crm, setCrm] = useState('');
  const [status, setStatus] = useState<OccurrenceStatus>('Ativa');
  const [anexoNome, setAnexoNome] = useState('');
  const [anexoUrl, setAnexoUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [parecerTecnico, setParecerTecnico] = useState('');
  const [dataConcessao, setDataConcessao] = useState('');
  const [atoConcessao, setAtoConcessao] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const isEditing = !!initialOccurrence;

  useEffect(() => {
    if (initialOccurrence) {
      setMatricula(initialOccurrence.matricula);
      setTipo(initialOccurrence.tipo);
      setDataInicio(initialOccurrence.data_inicio);
      setDataTermino(initialOccurrence.data_termino);
      setQuantidadeDias(initialOccurrence.quantidade_dias);
      setDataConcessao(initialOccurrence.data_concessao || '');
      setAtoConcessao(initialOccurrence.ato_concessao || '');
      
      const foundInCatalog = CID_CATALOG.find(c => initialOccurrence.cid?.startsWith(c.code));
      if (foundInCatalog) {
        setCidSelect(foundInCatalog.code);
        setCidCustom('');
      } else {
        setCidSelect('Outro');
        setCidCustom(initialOccurrence.cid || '');
      }

      setMedicoPerito(initialOccurrence.medico_perito);
      setCrm(initialOccurrence.crm);
      setStatus(initialOccurrence.status);
      setAnexoNome(initialOccurrence.anexo_nome || '');
      setAnexoUrl(initialOccurrence.anexo_url || '');
      setObservacoes(initialOccurrence.observacoes || '');
      setParecerTecnico(initialOccurrence.parecer_tecnico || '');
    } else {
      // Iniciar novo registro completamente limpo para preenchimento
      setMatricula(preselectedMatricula || '');
      setTipo('Licença Saúde');
      setDataInicio('');
      setDataTermino('');
      setQuantidadeDias(0);
      setDataConcessao('');
      setAtoConcessao('');
      setCidSelect('');
      setCidCustom('');
      setMedicoPerito('');
      setCrm('');
      setStatus('Ativa');
      setAnexoNome('');
      setAnexoUrl('');
      setObservacoes('');
      setParecerTecnico('');
    }
    setFormError('');
  }, [initialOccurrence, preselectedMatricula, isOpen]);

  // Close employee search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time calculation of days whenever start or end date changes
  useEffect(() => {
    if (dataInicio && dataTermino) {
      const days = calcularQuantidadeDias(dataInicio, dataTermino);
      setQuantidadeDias(days);
    } else {
      setQuantidadeDias(0);
    }
  }, [dataInicio, dataTermino]);

  // Dynamic filter for employees by matrícula, nome, cargo or secretaria
  const filteredEmployees = useMemo(() => {
    const rawTerm = employeeSearchTerm.trim().toLowerCase();
    if (!rawTerm) {
      return employees.slice(0, 30);
    }
    const cleanTerm = rawTerm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return employees.filter(emp => {
      const mat = (emp.matricula || '').toLowerCase();
      const nome = (emp.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cargo = (emp.cargo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const sec = (emp.secretaria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return (
        mat.includes(cleanTerm) ||
        nome.includes(cleanTerm) ||
        cargo.includes(cleanTerm) ||
        sec.includes(cleanTerm)
      );
    }).slice(0, 25);
  }, [employees, employeeSearchTerm]);

  if (!isOpen) return null;

  const selectedEmployee = employees.find(e => e.matricula.toUpperCase() === matricula.toUpperCase());

  // Handle mock certificate file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnexoNome(file.name);
      // Create local object URL for preview
      const url = URL.createObjectURL(file);
      setAnexoUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!matricula) {
      setFormError('Selecione o servidor municipal.');
      return;
    }

    if (!dataInicio) {
      setFormError('Informe a data de início do afastamento.');
      return;
    }

    if (!dataTermino) {
      setFormError('Informe a data de término do afastamento.');
      return;
    }

    if (quantidadeDias <= 0) {
      setFormError('A data de término deve ser posterior ou igual à data de início.');
      return;
    }

    if (!medicoPerito.trim()) {
      setFormError('Informe o médico perito oficial responsável.');
      return;
    }

    if (!crm.trim()) {
      setFormError('Informe o CRM do médico perito.');
      return;
    }

    let finalCid = '';
    if (cidSelect === 'Outro') {
      finalCid = cidCustom.trim();
    } else if (cidSelect) {
      const cat = CID_CATALOG.find(c => c.code === cidSelect);
      finalCid = cat ? `${cat.code} - ${cat.description}` : cidSelect;
    }

    if (tipo === 'Licença Definitiva') {
      if (!dataConcessao) {
        setFormError('Informe a Data da Concessão Definitiva.');
        return;
      }
      if (dataTermino && dataConcessao <= dataTermino) {
        setFormError(`A Licença Permanente/Definitiva não pode ser concedida dentro do prazo vigente da licença (término em ${dataTermino.split('-').reverse().join('/')}). A Data da Concessão deve ser posterior a essa data.`);
        return;
      }
    }

    setLoading(true);
    try {
      await onSave({
        id: initialOccurrence ? initialOccurrence.id : undefined,
        matricula,
        tipo,
        data_inicio: dataInicio,
        data_termino: dataTermino,
        quantidade_dias: quantidadeDias,
        cid: finalCid,
        medico_perito: medicoPerito.trim(),
        crm: crm.trim(),
        status,
        anexo_nome: anexoNome,
        anexo_url: anexoUrl,
        observacoes: observacoes.trim(),
        parecer_tecnico: parecerTecnico.trim(),
        data_concessao: tipo === 'Licença Definitiva' ? (dataConcessao || dataInicio) : undefined,
        ato_concessao: tipo === 'Licença Definitiva' ? atoConcessao.trim() : undefined,
      });
      onClose();
    } catch (err) {
      setFormError((err as Error).message || 'Erro ao salvar afastamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              tipo === 'Licença Saúde' 
                ? 'bg-amber-600' 
                : tipo === 'Readaptação' 
                ? 'bg-sky-600' 
                : tipo === 'Licença Definitiva'
                ? 'bg-purple-600'
                : 'bg-pink-600'
            }`}>
              {tipo === 'Licença Saúde' && <HeartPulse className="w-4 h-4" />}
              {tipo === 'Readaptação' && <RefreshCw className="w-4 h-4" />}
              {tipo === 'Licença Definitiva' && <FileBadge className="w-4 h-4" />}
              {tipo === 'Licença Maternidade' && <Baby className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isEditing ? `Editar Registro · ${initialOccurrence?.id}` : `Homologação Pericial · ${tipo}`}
              </h2>
              <p className="text-xs text-slate-400">
                Junta Médica Oficial do Instituto de Previdência do Município de Eusébio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Servidor Selector Dinâmico */}
          <div className="relative" ref={employeeDropdownRef}>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Servidor Municipal (Busca por Matrícula ou Nome) *
            </label>

            {selectedEmployee ? (
              /* Card do Servidor Selecionado */
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {selectedEmployee.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {selectedEmployee.nome}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-200 text-slate-800">
                        Matrícula: {selectedEmployee.matricula}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                        selectedEmployee.status === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {selectedEmployee.cargo} · {selectedEmployee.secretaria}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200 shrink-0">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Servidor Vinculado</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMatricula('');
                      setEmployeeSearchTerm('');
                      setIsEmployeeDropdownOpen(true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-300 transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Trocar Servidor</span>
                  </button>
                )}
              </div>
            ) : (
              /* Campo de Busca Dinâmica por Matrícula ou Nome */
              <div className="relative">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={employeeSearchTerm}
                    onChange={e => {
                      setEmployeeSearchTerm(e.target.value);
                      setIsEmployeeDropdownOpen(true);
                    }}
                    onFocus={() => setIsEmployeeDropdownOpen(true)}
                    placeholder="Digite o número da matrícula ou nome do servidor..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-900 transition-all placeholder:text-slate-400"
                  />
                  {employeeSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setEmployeeSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista Dropdown de Resultados da Busca */}
                {isEmployeeDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                      <span>Resultados da Busca</span>
                      <span>{filteredEmployees.length} servidores encontrados</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {filteredEmployees.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-xs">
                          <User className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <p className="font-semibold text-slate-700">Nenhum servidor encontrado</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Não encontramos nenhum cadastro com o termo "{employeeSearchTerm}".
                          </p>
                        </div>
                      ) : (
                        filteredEmployees.map(emp => (
                          <button
                            key={emp.matricula}
                            type="button"
                            onClick={() => {
                              setMatricula(emp.matricula);
                              setEmployeeSearchTerm('');
                              setIsEmployeeDropdownOpen(false);
                            }}
                            className="w-full text-left p-2.5 hover:bg-emerald-50/70 transition-colors flex items-center justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-xs bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 px-2 py-0.5 rounded border border-slate-200 group-hover:border-emerald-300 shrink-0">
                                {emp.matricula}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-slate-900 group-hover:text-emerald-950 truncate">
                                  {emp.nome}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {emp.cargo} · {emp.secretaria.split(' - ')[0]}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                emp.status === 'Ativo'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {emp.status}
                              </span>
                              <Check className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tipo de Ocorrência */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Ocorrência (Natureza do Ato Pericial) *
              </label>

              {isEditing && tipo === 'Licença Definitiva' ? (
                /* Caso esteja editando uma ocorrência que já foi tornada Definitiva */
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center">
                        <FileBadge className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-purple-950 block">
                          Licença Definitiva · Incapacidade Permanente
                        </span>
                        <span className="text-[10px] text-purple-700">
                          Afastamento definitivo oriundo de conversão pericial homologada
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-purple-200 text-purple-900 px-2 py-0.5 rounded">
                      Definitiva
                    </span>
                  </div>

                  {/* Campos de Concessão */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-200/80">
                    <div>
                      {(() => {
                        let minDate = '';
                        if (dataTermino) {
                          const dt = new Date(dataTermino + 'T00:00:00');
                          dt.setDate(dt.getDate() + 1);
                          minDate = dt.toISOString().split('T')[0];
                        }
                        const isInvalid = dataConcessao && dataTermino && dataConcessao <= dataTermino;
                        return (
                          <div>
                            <label className="block text-[11px] font-semibold text-purple-950 mb-1 flex items-center justify-between">
                              <span>Data da Concessão Definitiva *</span>
                              {minDate && (
                                <span className="text-[10px] text-purple-800 font-mono font-medium">
                                  Mín: {minDate.split('-').reverse().join('/')}
                                </span>
                              )}
                            </label>
                            <input
                              type="date"
                              required
                              min={minDate || undefined}
                              value={dataConcessao}
                              onChange={e => setDataConcessao(e.target.value)}
                              className={`w-full px-2.5 py-1.5 text-xs font-mono bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-900 ${
                                isInvalid
                                  ? 'border-red-400 focus:ring-red-500 bg-red-50/40 text-red-950'
                                  : 'border-purple-300 focus:ring-purple-500'
                              }`}
                            />
                            {isInvalid ? (
                              <p className="text-[10px] text-red-600 font-medium mt-1">
                                Não pode ser dentro do prazo vigente (até {dataTermino.split('-').reverse().join('/')}).
                              </p>
                            ) : (
                              <p className="text-[10px] text-purple-800 mt-1">
                                Deve ser posterior ao término da licença temporária.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-950 mb-1">
                        Ato Concessório / Portaria
                      </label>
                      <input
                        type="text"
                        value={atoConcessao}
                        onChange={e => setAtoConcessao(e.target.value)}
                        placeholder="Ex: Portaria IPME nº 042/2026"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Licença Saúde */}
                    <button
                      type="button"
                      onClick={() => setTipo('Licença Saúde')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tipo === 'Licença Saúde'
                          ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs font-bold ring-1 ring-amber-400/50'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <HeartPulse className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Licença Saúde</span>
                    </button>

                    {/* 2. Readaptação */}
                    <button
                      type="button"
                      onClick={() => setTipo('Readaptação')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tipo === 'Readaptação'
                          ? 'bg-sky-50 border-sky-400 text-sky-900 shadow-2xs font-bold ring-1 ring-sky-400/50'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="truncate">Readaptação</span>
                    </button>

                    {/* 3. Licença Maternidade */}
                    <button
                      type="button"
                      onClick={() => {
                        setTipo('Licença Maternidade');
                        if (dataInicio && !dataTermino) {
                          const dt = new Date(dataInicio + 'T00:00:00');
                          dt.setDate(dt.getDate() + 179);
                          const computedEnd = dt.toISOString().split('T')[0];
                          setDataTermino(computedEnd);
                          setQuantidadeDias(180);
                        }
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        tipo === 'Licença Maternidade'
                          ? 'bg-pink-50 border-pink-400 text-pink-900 shadow-2xs font-bold ring-1 ring-pink-400/50'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Baby className="w-3.5 h-3.5 text-pink-600 shrink-0" />
                      <span className="truncate">Licença Maternidade</span>
                    </button>
                  </div>

                  {tipo === 'Licença Maternidade' && (
                    <p className="text-[11px] text-pink-700 mt-1.5 flex items-center gap-1">
                      <span>ℹ️ Licença Maternidade com período legal previsto de 180 dias estatutários (Programa Servidora Cidadã).</span>
                    </p>
                  )}

                  {!isEditing && (
                    <div className="mt-2.5 p-3 rounded-xl bg-purple-50/80 border border-purple-200/90 flex items-start gap-2.5 text-xs text-purple-950">
                      <FileBadge className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-purple-900 font-bold block">Como homologar Licença Definitiva?</strong>
                        <p className="text-purple-800 text-[11px] mt-0.5 leading-relaxed">
                          A <strong>Licença Definitiva</strong> não pode ser criada diretamente através de uma nova ocorrência. Ela deve ser originada a partir da transformação de uma licença já ativa ou prorrogada através da ação <strong>"Tornar Definitiva"</strong> (disponível na listagem de ocorrências e no prontuário do servidor), momento em que é informada a obrigatória <strong>Data da Concessão</strong>.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status da Licença */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status da Ocorrência *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as OccurrenceStatus)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
              >
                <option value="Ativa">Ativa (Em andamento)</option>
                <option value="Prorrogada">Prorrogada (Prazo estendido)</option>
                <option value="Concluída">Concluída (Servidor liberado / retornou)</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            {/* Data de Início */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Início *
              </label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            {/* Data de Término / Previsão */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Término / Previsão de Retorno *
              </label>
              <input
                type="date"
                required
                value={dataTermino}
                onChange={e => setDataTermino(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />
            </div>

            {/* Quantidade de Dias e Dias Pagos (Auto-Calculados) */}
            <div className="sm:col-span-2 bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <span className="text-xs font-semibold text-emerald-950 block">
                  Prazos Computados (Regra Previdenciária):
                </span>
                <span className="text-[11px] text-emerald-800 block mt-0.5">
                  Total de dias: <strong className="font-mono">{quantidadeDias} {quantidadeDias === 1 ? 'dia' : 'dias'}</strong>
                </span>
                <span className="text-[10px] text-slate-500 block">
                  * Primeiros 15 dias são assumidos pela Prefeitura Municipal.
                </span>
              </div>
              <div className="sm:text-right bg-white/80 p-2.5 rounded-lg border border-emerald-200/60">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Dias Pagos pelo IPME
                </span>
                <div className="flex sm:justify-end items-baseline gap-1 text-emerald-800 font-mono font-bold text-lg tabular-nums">
                  <span>{calcularDiasPagos(quantidadeDias)}</span>
                  <span className="text-xs font-sans text-emerald-700 font-semibold">
                    {calcularDiasPagos(quantidadeDias) === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
              </div>
            </div>

            {/* CID-10 Selection */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Classificação Internacional de Doenças (CID-10) · Opcional / Sigiloso
              </label>
              <select
                value={cidSelect}
                onChange={e => setCidSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-800 mb-2"
              >
                <option value="">Não informado / Resguardado pelo sigilo médico</option>
                {CID_CATALOG.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code === 'Outro' ? 'Outro código CID-10 (Digitar manualmente)' : `${c.code} — ${c.description}`}
                  </option>
                ))}
              </select>

              {cidSelect === 'Outro' && (
                <input
                  type="text"
                  placeholder="Ex: F43.2 - Transtornos de adaptação / Reação ao estresse..."
                  value={cidCustom}
                  onChange={e => setCidCustom(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              )}
            </div>

            {/* Médico Perito */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Médico Perito Oficial Responsável *
                </label>
                {doctors && doctors.length > 0 && (
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {doctors.filter(d => d.ativo).length} cadastrado(s)
                  </span>
                )}
              </div>

              {doctors && doctors.length > 0 && (
                <select
                  value={
                    doctors.some(d => d.nome.toLowerCase() === medicoPerito.toLowerCase())
                      ? doctors.find(d => d.nome.toLowerCase() === medicoPerito.toLowerCase())?.id
                      : medicoPerito ? 'CUSTOM' : ''
                  }
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'CUSTOM') {
                      // Keep custom entry
                    } else if (!val) {
                      setMedicoPerito('');
                      setCrm('');
                    } else {
                      const found = doctors.find(d => d.id === val);
                      if (found) {
                        setMedicoPerito(found.nome);
                        setCrm(found.crm);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 mb-1.5"
                >
                  <option value="">Selecione o médico perito cadastrado...</option>
                  {doctors.filter(d => d.ativo).map(doc => (
                    <option key={doc.id} value={doc.id}>
                      #{doc.id} · {doc.nome} — {doc.crm} ({doc.especialidade || 'Perícia'})
                    </option>
                  ))}
                  <option value="CUSTOM">Outro Médico (Digitar manualmente)</option>
                </select>
              )}

              <input
                type="text"
                required
                value={medicoPerito}
                onChange={e => setMedicoPerito(e.target.value)}
                placeholder="Ex: Dr. Marcelo Cavalcante Holanda"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* CRM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número do Registro CRM *
              </label>
              <input
                type="text"
                required
                value={crm}
                onChange={e => setCrm(e.target.value)}
                placeholder="Ex: CRM/CE 14.890"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Anexo de Atestado / Laudo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anexo do Atestado / Laudo Pericial (PDF / Imagem)
              </label>
              <div className="flex items-center gap-3">
                <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Selecionar Documento</span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {anexoNome ? (
                  <span className="text-xs font-mono text-emerald-700 font-medium truncate max-w-xs">
                    Arquivo: {anexoNome}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Nenhum arquivo anexado (opcional)</span>
                )}
              </div>
            </div>

            {/* Parecer Técnico da Junta Médica */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parecer Técnico da Junta Médica Pericial / Restrições Funcionais
              </label>
              <textarea
                rows={3}
                value={parecerTecnico}
                onChange={e => setParecerTecnico(e.target.value)}
                placeholder="Descreva as conclusões periciais, recomendações de readaptação (ex: vedação de esforço repetitivo, remanejamento de ambiente) ou justificativa técnica..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Observações Gerais */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Administrativas Internas
              </label>
              <textarea
                rows={2}
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Observações complementares de tramitação ou notas de controle..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : isEditing ? 'Salvar Ocorrência' : 'Homologar Afastamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
