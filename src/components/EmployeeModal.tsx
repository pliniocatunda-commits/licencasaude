import React, { useState, useEffect } from 'react';
import { Employee, EmployeeStatus, Secretaria } from '../types/index.ts';
import { 
  formatarCPF, 
  validarCPF, 
  formatarTelefone, 
  formatarMatricula,
  SECRETARIAS_MUNICIPAIS, 
  limparCaracteres,
  normalizeSecretaria
} from '../utils/validation.ts';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  User, 
  Plus, 
  Building2,
  Copy,
  AlertTriangle
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Partial<Employee>) => Promise<void>;
  initialEmployee?: Employee | null;
  existingEmployees?: Employee[];
  secretariasList?: Secretaria[];
  onQuickCreateSecretaria?: () => void;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEmployee,
  existingEmployees = [],
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

  // Estado para diálogo de confirmação de novo vínculo (mesmo CPF, matrícula diferente)
  const [confirmNewVinculoData, setConfirmNewVinculoData] = useState<{
    existing: Employee;
    newMatricula: string;
  } | null>(null);

  const isEditing = !!initialEmployee;

  // Opções de secretarias disponíveis
  const availableSecretarias = React.useMemo(() => {
    if (secretariasList && secretariasList.length > 0) {
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
      setMatricula(formatarMatricula(initialEmployee.matricula));
      setNome(initialEmployee.nome);
      setCpf(formatarCPF(initialEmployee.cpf));
      setTelefone(formatarTelefone(initialEmployee.telefone || ''));
      const norm = normalizeSecretaria(initialEmployee.secretaria, secretariasList);
      setSecretaria(norm.canonicalKey);
      setCargo(initialEmployee.cargo);
      setStatus(initialEmployee.status);
      setDataAdmissao(initialEmployee.data_admissao || '');
      setEmail(initialEmployee.email || '');
      setCpfError('');
    } else {
      // Deixar a matrícula em branco para preenchimento manual do usuário (sem sugestão aleatória)
      setMatricula('');
      setNome('');
      setCpf('');
      setTelefone('');
      setSecretaria(availableSecretarias[0]?.display || SECRETARIAS_MUNICIPAIS[0]);
      setCargo('');
      setStatus('Ativo');
      setDataAdmissao(new Date().toISOString().split('T')[0]);
      setEmail('');
      setCpfError('');
    }
    setFormError('');
    setConfirmNewVinculoData(null);
  }, [initialEmployee, isOpen, availableSecretarias, secretariasList]);

  // Detecção proativa de servidor já existente com o CPF digitado
  const cleanCurrentCpf = limparCaracteres(cpf);
  const existingServidorWithSameCpf = React.useMemo(() => {
    if (cleanCurrentCpf.length !== 11 || !validarCPF(cleanCurrentCpf)) return null;
    return existingEmployees.find(e => {
      // Ignora o próprio servidor em edição
      if (initialEmployee && formatarMatricula(e.matricula) === formatarMatricula(initialEmployee.matricula)) {
        return false;
      }
      return limparCaracteres(e.cpf) === cleanCurrentCpf;
    }) || null;
  }, [cleanCurrentCpf, existingEmployees, initialEmployee]);

  if (!isOpen) return null;

  // Ao sair do campo matrícula (onBlur), preenche automaticamente com zeros à esquerda se < 6 dígitos
  const handleMatriculaBlur = () => {
    if (matricula.trim()) {
      setMatricula(formatarMatricula(matricula));
    }
  };

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

  // Copia dados pessoais de um servidor já existente com o mesmo CPF
  const handleCopyExistingData = () => {
    if (existingServidorWithSameCpf) {
      setNome(existingServidorWithSameCpf.nome);
      if (existingServidorWithSameCpf.telefone) {
        setTelefone(formatarTelefone(existingServidorWithSameCpf.telefone));
      }
      if (existingServidorWithSameCpf.email) {
        setEmail(existingServidorWithSameCpf.email);
      }
    }
  };

  // Efetiva a gravação do servidor
  const executeSave = async (matriculaToSave: string) => {
    const normSec = normalizeSecretaria(secretaria, secretariasList);
    setLoading(true);
    try {
      await onSave({
        matricula: matriculaToSave,
        nome: nome.trim(),
        cpf: formatarCPF(cpf),
        telefone: telefone.trim(),
        secretaria: normSec.canonicalKey,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!matricula.trim() || !nome.trim() || !cpf.trim()) {
      setFormError('Por favor preencha Matrícula, Nome e CPF.');
      return;
    }

    // Formata a matrícula para ter no mínimo 6 caracteres com zeros à esquerda
    const cleanMatricula = formatarMatricula(matricula);
    setMatricula(cleanMatricula);

    const cleanCpf = limparCaracteres(cpf);
    if (!validarCPF(cleanCpf)) {
      setCpfError('CPF inválido. Por favor forneça um número de CPF válido.');
      return;
    }

    // Validações de duplicação em novos cadastros
    if (!isEditing) {
      // 1. Não permitir cadastros duplicados (Mesma matrícula E mesmo CPF)
      const duplicateSameMatriculaAndCpf = existingEmployees.find(e => 
        formatarMatricula(e.matricula) === cleanMatricula &&
        limparCaracteres(e.cpf) === cleanCpf
      );
      if (duplicateSameMatriculaAndCpf) {
        setFormError(
          `Servidor já cadastrado: Já existe um cadastro ativo para este servidor no sistema com a Matrícula ${cleanMatricula} e CPF ${formatarCPF(cleanCpf)} (${duplicateSameMatriculaAndCpf.nome} · ${duplicateSameMatriculaAndCpf.cargo}).`
        );
        return;
      }

      // 2. Não permitir usar uma matrícula que já pertence a outro servidor (outro CPF)
      const duplicateMatriculaDiffCpf = existingEmployees.find(e =>
        formatarMatricula(e.matricula) === cleanMatricula &&
        limparCaracteres(e.cpf) !== cleanCpf
      );
      if (duplicateMatriculaDiffCpf) {
        setFormError(
          `A Matrícula ${cleanMatricula} já está vinculada ao servidor ${duplicateMatriculaDiffCpf.nome} (CPF: ${formatarCPF(duplicateMatriculaDiffCpf.cpf)}). A matrícula deve ser exclusiva.`
        );
        return;
      }

      // 3. Duplicação permitida: Mesmo CPF com matrícula diferente (múltiplos vínculos/acúmulo lícito)
      // Exibe diálogo de confirmação perguntando se deseja efetivar com nova matrícula ou cancelar
      const existingSameCpfDiffMatricula = existingEmployees.find(e =>
        limparCaracteres(e.cpf) === cleanCpf &&
        formatarMatricula(e.matricula) !== cleanMatricula
      );
      if (existingSameCpfDiffMatricula) {
        setConfirmNewVinculoData({
          existing: existingSameCpfDiffMatricula,
          newMatricula: cleanMatricula,
        });
        return;
      }
    }

    await executeSave(cleanMatricula);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F223D]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#BED4EF] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#3868A0] text-white flex items-center justify-between border-b border-[#2B5485]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isEditing ? `Editar Servidor · ${initialEmployee?.matricula}` : 'Cadastrar Novo Servidor Ativo'}
              </h2>
              <p className="text-xs text-blue-100/90">
                IPME · Instituto de Previdência do Município de Eusébio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Atenção ao Cadastro</span>
                <span>{formError}</span>
              </div>
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
                onBlur={handleMatriculaBlur}
                disabled={isEditing}
                placeholder="Ex: 000152 ou 152"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Mínimo 6 caracteres (valores menores são preenchidos com zeros à esquerda, ex: 152 → 000152).
              </span>
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
                <span className="text-[10px] text-slate-400 block mt-0.5">Validação oficial por algoritmo de dígitos verificadores.</span>
              )}
            </div>

            {/* Aviso Proativo de Vínculo com Mesmo CPF */}
            {existingServidorWithSameCpf && !isEditing && (
              <div className="sm:col-span-2 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Servidor já possui cadastro no município</span>
                  </div>
                  <p className="text-[11px] text-slate-700">
                    Cadastrado sob a matrícula <strong className="font-mono text-slate-900">{existingServidorWithSameCpf.matricula}</strong> em nome de <strong>{existingServidorWithSameCpf.nome}</strong> ({existingServidorWithSameCpf.cargo} · {existingServidorWithSameCpf.secretaria}).
                  </p>
                </div>
                {!nome && (
                  <button
                    type="button"
                    onClick={handleCopyExistingData}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10.5px] font-semibold shrink-0 cursor-pointer flex items-center gap-1 transition-colors self-start sm:self-auto"
                    title="Copiar nome e dados cadastrais do servidor para agilizar o preenchimento"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Dados</span>
                  </button>
                )}
              </div>
            )}

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
                {secretaria && !availableSecretarias.some(s => s.display === secretaria || s.nome === secretaria) && (
                  <option value={secretaria}>
                    {secretaria}
                  </option>
                )}
                {availableSecretarias.map(s => (
                  <option key={s.id} value={s.display}>
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
                <option value="Aposentado">Aposentado (Incapacidade definitiva / aposentadoria)</option>
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
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!cpfError}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar Servidor'}</span>
            </button>
          </div>
        </form>

        {/* Diálogo de Confirmação de Novo Vínculo (Mesmo CPF com Matrícula Diferente) */}
        {confirmNewVinculoData && (
          <div className="fixed inset-0 z-60 bg-[#0F223D]/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-amber-300 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirmação de Novo Vínculo Funcional
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acúmulo lícito / Novo vínculo para o mesmo CPF
                  </p>
                </div>
              </div>

              <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 text-xs text-amber-950 space-y-3">
                <p className="leading-relaxed">
                  Já existe um cadastro para o CPF <strong>{formatarCPF(cpf)}</strong> com a matrícula <strong className="font-mono text-slate-900">{confirmNewVinculoData.existing.matricula}</strong>:
                </p>
                
                <div className="bg-white/90 rounded-lg p-3 border border-amber-200/70 text-[11px] space-y-1.5 font-sans">
                  <div className="flex items-center justify-between pb-1 border-b border-amber-100">
                    <span className="text-slate-500 font-medium">Servidor:</span>
                    <strong className="text-slate-900">{confirmNewVinculoData.existing.nome}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Vínculo Existente:</span>
                    <span className="font-semibold text-slate-800">
                      Matrícula <span className="font-mono">{confirmNewVinculoData.existing.matricula}</span> · {confirmNewVinculoData.existing.cargo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-100">
                    <span className="text-emerald-700 font-bold">Novo Vínculo a Efetivar:</span>
                    <span className="font-bold text-emerald-800">
                      Matrícula <span className="font-mono">{confirmNewVinculoData.newMatricula}</span> · {cargo || 'Servidor Municipal'}
                    </span>
                  </div>
                </div>

                <p className="leading-relaxed text-[11.5px] font-medium text-slate-800">
                  Deseja efetivar o novo cadastro deste servidor com a nova matrícula <strong className="font-mono text-emerald-800">{confirmNewVinculoData.newMatricula}</strong> ou cancelar?
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmNewVinculoData(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mat = confirmNewVinculoData.newMatricula;
                    setConfirmNewVinculoData(null);
                    executeSave(mat);
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Efetivar Novo Cadastro</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
