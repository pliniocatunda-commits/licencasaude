import React, { useState, useEffect } from 'react';
import { Employee, EmployeeStatus, Secretaria } from '../types/index.ts';
import { 
  formatarCPF, 
  validarCPF, 
  formatarTelefone, 
  SECRETARIAS_MUNICIPAIS, 
  limparCaracteres 
} from '../utils/validation.ts';
import { X, CheckCircle2, AlertCircle, Save, User, ShieldCheck, Plus, Building2 } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => Promise<void>;
  initialEmployee?: Employee | null;
  secretariasList?: Secretaria[];
  onQuickCreateSecretaria?: () => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEmployee,
  secretariasList = [],
  onQuickCreateSecretaria,
}) => {
  const [matricula, setMatricula] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [secretaria, setSecretaria] = useState('');
  const [cargo, setCargo] = useState('');
  const [status, setStatus] = useState<EmployeeStatus>('Ativo');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [email, setEmail] = useState('');
  
  const [cpfError, setCpfError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const isEditing = !!initialEmployee;

  // Compute available secretarias options (active secretarias from table + fallback if none loaded)
  const availableSecretarias = React.useMemo(() => {
    if (secretariasList && secretariasList.length > 0) {
      // Return active secretarias, or all if none active
      const activeOnly = secretariasList.filter(s => s.ativa);
      const list = activeOnly.length > 0 ? activeOnly : secretariasList;
      return list.map(s => ({
        id: s.id,
        sigla: s.sigla,
        nome: s.nome,
        display: `${s.sigla} - ${s.nome}`
      }));
    }
    return SECRETARIAS_MUNICIPAIS.map(s => ({
      id: s,
      sigla: s.split(' ')[0] || s,
      nome: s,
      display: s
    }));
  }, [secretariasList]);

  useEffect(() => {
    if (initialEmployee) {
      setMatricula(initialEmployee.matricula);
      setNome(initialEmployee.nome);
      setCpf(formatarCPF(initialEmployee.cpf));
      setTelefone(formatarTelefone(initialEmployee.telefone || ''));
      setSecretaria(initialEmployee.secretaria);
      setCargo(initialEmployee.cargo);
      setStatus(initialEmployee.status);
      setDataAdmissao(initialEmployee.data_admissao || '');
      setEmail(initialEmployee.email || '');
      setCpfError('');
    } else {
      // Auto-suggest next matricula for convenience
      const randNum = Math.floor(1000 + Math.random() * 9000);
      setMatricula(`EUS-${randNum}`);
      setNome('');
      setCpf('');
      setTelefone('');
      setSecretaria(availableSecretarias[0]?.nome || SECRETARIAS_MUNICIPAIS[0]);
      setCargo('');
      setStatus('Ativo');
      setDataAdmissao(new Date().toISOString().split('T')[0]);
      setEmail('');
      setCpfError('');
    }
    setFormError('');
  }, [initialEmployee, isOpen, availableSecretarias]);

  if (!isOpen) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatarCPF(raw);
    setCpf(formatted);

    const clean = limparCaracteres(raw);
    if (clean.length === 11) {
      if (!validarCPF(clean)) {
        setCpfError('CPF inválido de acordo com o algoritmo de verificação da Receita Federal.');
      } else {
        setCpfError('');
      }
    } else if (clean.length > 0 && clean.length < 11) {
      setCpfError('O CPF deve conter exatamente 11 dígitos.');
    } else {
      setCpfError('');
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefone(formatarTelefone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!matricula.trim() || !nome.trim() || !cpf.trim()) {
      setFormError('Por favor preencha Matrícula, Nome e CPF.');
      return;
    }

    const cleanCpf = limparCaracteres(cpf);
    if (!validarCPF(cleanCpf)) {
      setCpfError('CPF inválido. Por favor forneça um número de CPF válido.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        matricula: matricula.trim().toUpperCase(),
        nome: nome.trim(),
        cpf: formatarCPF(cpf),
        telefone: telefone.trim(),
        secretaria: secretaria.trim(),
        setor: initialEmployee?.setor || '',
        cargo: cargo.trim() || 'Servidor Municipal',
        status,
        data_admissao: dataAdmissao,
        email: email.trim(),
      });
      onClose();
    } catch (err) {
      setFormError((err as Error).message || 'Erro ao salvar servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isEditing ? `Editar Servidor · ${initialEmployee?.matricula}` : 'Cadastrar Novo Servidor Ativo'}
              </h2>
              <p className="text-xs text-slate-400">
                IPME · Instituto de Previdência do Município de Eusébio
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matrícula */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Matrícula (Chave Primária) *
              </label>
              <input
                type="text"
                required
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                disabled={isEditing}
                placeholder="Ex: EUS-04921"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400">Identificador funcional único no município.</span>
            </div>

            {/* CPF */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CPF (Validado) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={14}
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className={`w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 ${
                    cpfError 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50/30' 
                      : cpf && !cpfError && limparCaracteres(cpf).length === 11 
                        ? 'border-emerald-300 focus:ring-emerald-500' 
                        : 'border-slate-200 focus:ring-emerald-500'
                  }`}
                />
                {cpf && !cpfError && limparCaracteres(cpf).length === 11 && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {cpfError ? (
                <span className="text-[10px] text-red-600 font-medium block mt-0.5">{cpfError}</span>
              ) : (
                <span className="text-[10px] text-slate-400">Validação oficial por algoritmo de dígitos verificadores.</span>
              )}
            </div>

            {/* Nome Completo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo do Servidor *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Maria das Graças Alencar"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                maxLength={15}
                value={telefone}
                onChange={handleTelefoneChange}
                placeholder="(85) 98800-0000"
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Cargo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Função Pública *
              </label>
              <input
                type="text"
                required
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Ex: Professor de Educação Básica II, Enfermeiro..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Secretaria */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Secretaria Municipal de Lotação *</span>
                </label>
                {onQuickCreateSecretaria && (
                  <button
                    type="button"
                    onClick={onQuickCreateSecretaria}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                    title="Adicionar uma nova secretaria ao cadastro do município"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Cadastrar Nova Secretaria</span>
                  </button>
                )}
              </div>
              <select
                value={secretaria}
                onChange={e => setSecretaria(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {/* Ensure current value exists even if inactive or legacy */}
                {secretaria && !availableSecretarias.some(s => s.nome === secretaria) && (
                  <option value={secretaria}>
                    {secretaria} (Lotação atual)
                  </option>
                )}
                {availableSecretarias.map(s => (
                  <option key={s.id} value={s.nome}>
                    {s.display}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Selecione o órgão ou secretaria municipal onde o servidor exerce suas atividades funcionais
              </p>
            </div>

            {/* Status Funcional */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Funcional Atual *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as EmployeeStatus)}
                className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="Ativo">Ativo (Em exercício regular)</option>
                <option value="Licenciado">Licenciado (Afastado por Licença Saúde)</option>
                <option value="Readaptado">Readaptado (Atividade compatível com limitação)</option>
              </select>
            </div>

            {/* Data de Admissão */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Admissão no Município
              </label>
              <input
                type="date"
                value={dataAdmissao}
                onChange={e => setDataAdmissao(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            {/* Email Corporativo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Institucional (Opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome.sobrenome@eusebio.ce.gov.br"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
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
              disabled={loading || !!cpfError}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Servidor'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
