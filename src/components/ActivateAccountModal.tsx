import React, { useState } from 'react';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  KeyRound, 
  Send, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface ActivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialCode?: string;
  onConfirmEmail: (email: string, code: string) => Promise<void>;
  onResendEmail: (email: string) => Promise<{ code: string }>;
  onSuccessLogin?: (email: string) => Promise<void>;
}

export const ActivateAccountModal: React.FC<ActivateAccountModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  initialCode = '',
  onConfirmEmail,
  onResendEmail,
  onSuccessLogin,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSentCode, setLastSentCode] = useState<string | null>(initialCode || null);

  React.useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
    if (initialCode) setCode(initialCode);
  }, [initialEmail, initialCode]);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const emailTrim = email.trim().toLowerCase();
    const codeTrim = code.trim();

    if (!emailTrim) {
      setError('Informe seu e-mail corporativo cadastrado.');
      return;
    }

    if (!codeTrim || codeTrim.length < 5) {
      setError('Por favor, informe o código de confirmação de 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      await onConfirmEmail(emailTrim, codeTrim);
      setSuccess('Cadastro e e-mail confirmados com sucesso! Seu acesso institucional foi ativado.');
      setTimeout(async () => {
        if (onSuccessLogin) {
          await onSuccessLogin(emailTrim);
        }
        onClose();
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'Falha ao validar código de ativação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim) {
      setError('Informe o e-mail corporativo para reenviar o código.');
      return;
    }

    setResending(true);
    setError('');
    try {
      const res = await onResendEmail(emailTrim);
      setLastSentCode(res.code);
      if (res.code) setCode(res.code);
      setSuccess(`Novo código de ativação gerado e enviado para ${emailTrim}!`);
    } catch (err) {
      setError((err as Error).message || 'Erro ao reenviar confirmação por e-mail.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1A2F]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 text-xs">
        
        {/* Header */}
        <div className="bg-[#102A4C] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Confirmação de Cadastro por E-mail
              </h3>
              <p className="text-[11px] text-blue-200/70">
                Ativação de Acesso Pericial IPME
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative strip */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-start gap-2.5 text-emerald-900 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            Digite o <strong>código de 6 dígitos</strong> enviado para o seu e-mail corporativo cadastrado pelo Administrador Master para ativar sua conta.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
          )}

          {/* E-mail Corporativo */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              E-mail Corporativo Oficial *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operador@eusebio.ce.gov.br"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Código de 6 dígitos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Código de Confirmação (PIN de 6 Dígitos) *
              </label>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                <span>Reenviar código</span>
              </button>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 849201"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-center tracking-widest text-base font-bold text-slate-900"
              />
            </div>
            {lastSentCode && (
              <div className="mt-1.5 p-2 bg-slate-100 rounded-lg border border-slate-200 text-[10px] text-slate-600 flex items-center justify-between">
                <span>Código gerado para ativação: <strong className="font-mono text-emerald-700 text-xs tracking-wider">{lastSentCode}</strong></span>
                <span className="text-slate-500 font-medium">Validar agora</span>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Validando...' : 'Confirmar e Ativar Acesso'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
