import React, { useState, useEffect } from 'react';
import { Secretaria } from '../types/index.ts';
import { X, Building2, Save, AlertCircle, Phone, Mail, MapPin, User, CheckCircle2 } from 'lucide-react';
import { formatarTelefone } from '../utils/validation.ts';

interface SecretariaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Secretaria>) => Promise<void>;
  initialSecretaria?: Secretaria | null;
}

export const SecretariaModal: React.FC<SecretariaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSecretaria,
}) => {
  const [sigla, setSigla] = useState('');
  const [nome, setNome] = useState('');
  const [secretario, setSecretario] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [ativa, setAtiva] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialSecretaria) {
      setSigla(initialSecretaria.sigla || '');
      setNome(initialSecretaria.nome || '');
      setSecretario(initialSecretaria.secretario || '');
      setEmail(initialSecretaria.email || '');
      setTelefone(initialSecretaria.telefone || '');
      setEndereco(initialSecretaria.endereco || '');
      setAtiva(initialSecretaria.ativa !== false);
    } else {
      setSigla('');
      setNome('');
      setSecretario('');
      setEmail('');
      setTelefone('');
      setEndereco('');
      setAtiva(true);
    }
    setError(null);
  }, [initialSecretaria, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSigla = sigla.trim().toUpperCase();
    const cleanNome = nome.trim();

    if (!cleanSigla) {
      setError('A sigla da Secretaria é obrigatória (ex: SME, SMS, SEFIN).');
      return;
    }

    if (!cleanNome) {
      setError('O nome completo da Secretaria é obrigatório.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        sigla: cleanSigla,
        nome: cleanNome,
        secretario: secretario.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        telefone: telefone.trim() || undefined,
        endereco: endereco.trim() || undefined,
        ativa,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar secretaria. Verifique os dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarTelefone(e.target.value);
    setTelefone(formatted);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialSecretaria ? 'Editar Secretaria Municipal' : 'Nova Secretaria Municipal'}
              </h3>
              <p className="text-xs text-emerald-200/80">
                Cadastro e lotação de órgãos da Prefeitura de Eusébio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sigla */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sigla *
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="Ex: SME"
                value={sigla}
                onChange={(e) => setSigla(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-500">Ex: SME, SMS, SEFIN</span>
            </div>

            {/* Nome Completo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Órgão / Secretaria *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Secretaria Municipal de Educação"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Secretário Titular */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Secretário(a) Titular / Responsável</span>
            </label>
            <input
              type="text"
              placeholder="Nome do(a) Secretário(a) ou Diretor(a)"
              value={secretario}
              onChange={(e) => setSecretario(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Email & Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>E-mail Institucional</span>
              </label>
              <input
                type="email"
                placeholder="exemplo@eusebio.ce.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Telefone / Ramal</span>
              </label>
              <input
                type="text"
                placeholder="(85) 3260-0000"
                value={telefone}
                onChange={handlePhoneChange}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>Endereço / Localização</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Av. Eusébio de Queiroz, 1200 - Centro, Eusébio - CE"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Ativo / Inativo */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800">Status de Ativação</span>
              <p className="text-[11px] text-slate-500">
                Secretarias inativas não aparecem como opção padrão para novas lotações
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ativa}
                onChange={(e) => setAtiva(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2 text-xs font-medium text-slate-700">
                {ativa ? 'Ativa' : 'Inativa'}
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Salvando...' : initialSecretaria ? 'Atualizar Secretaria' : 'Cadastrar Secretaria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
