import React, { useState } from 'react';
import { AppUser } from '../types/index.ts';
import { 
  Mail, 
  CheckCircle2, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  KeyRound, 
  ExternalLink,
  Sparkles,
  Building2,
  AlertCircle
} from 'lucide-react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  onConfirmNow?: (email: string, code: string) => Promise<void>;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmNow,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !user) return null;

  const code = user.confirmation_code || '123456';
  const confirmationUrl = `${window.location.origin}?confirm_token=${user.confirmation_token || 'token'}&email=${encodeURIComponent(user.email)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleImmediateActivation = async () => {
    if (!onConfirmNow) return;
    try {
      setConfirming(true);
      setErrorMsg('');
      await onConfirmNow(user.email, code);
      setSuccessMsg('Cadastro e e-mail confirmados com sucesso! O operador agora está com status Ativo.');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg((err as Error).message || 'Erro ao confirmar cadastro.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1A2F]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 text-xs">
        
        {/* Header modal bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>E-mail Institucional de Confirmação & Ativação</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Despachado
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Destinatário: {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informative notification strip */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-start gap-2.5 text-amber-900 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Autenticação de Confirmação Ativa:</strong> Para garantir a conformidade institucional do RPPS de Eusébio, novos operadores devem validar o endereço de e-mail corporativo utilizando o <strong>código PIN de 6 dígitos</strong> ou o link de ativação enviado.
          </div>
        </div>

        {/* Message preview simulation */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto bg-slate-50">
          
          {successMsg && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-900 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Email Preview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            {/* Email Header */}
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden">
                  <img 
                    src="/logo-ipme.png" 
                    alt="Logomarca Oficial IPME" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    IPME · Instituto de Previdência do Município de Eusébio
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sistema Eletrônico de Homologação de Licenças & Readaptações
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400">
                {new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Email Body */}
            <div className="space-y-3 text-slate-700 leading-relaxed text-xs">
              <p>
                Olá, <strong className="text-slate-900">{user.name}</strong>,
              </p>
              <p>
                Seu cadastro de operador corporativo no Sistema Pericial do <strong>IPME (Prefeitura de Eusébio)</strong> foi realizado com sucesso pelo Administrador Geral Master.
              </p>

              {/* Box of credentials & Code */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Credenciais de Acesso Institucional
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Ambiente Auditado</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">E-mail Corporativo:</span>
                    <span className="font-mono font-semibold text-slate-100">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Senha Provisória:</span>
                    <span className="font-mono font-semibold text-amber-300">
                      {user.password || 'Ipme@2026'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cargo / Função:</span>
                    <span className="font-semibold text-slate-200">{user.cargo || 'Operador Pericial'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lotação:</span>
                    <span className="font-semibold text-slate-200">{user.department}</span>
                  </div>
                </div>

                {/* 6-Digit PIN Banner */}
                <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-lg p-3 text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">
                    Código PIN de Confirmação & Ativação (6 Dígitos)
                  </span>
                  <div className="text-2xl font-black font-mono tracking-widest text-emerald-400">
                    {code}
                  </div>
                  <span className="text-[10px] text-emerald-200/70 block">
                    Válido para liberação do acesso de primeiro login
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600">
                Por motivos de segurança e integridade das perícias previdenciárias (Lei nº 465/2002), altere sua senha original para uma credencial pessoal no seu primeiro login.
              </p>
            </div>

            {/* Email Footer */}
            <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-1">
              <span>Autarquia Municipal Criada pela Lei nº 465/2002 · Eusébio - CE</span>
              <span>Mensagem gerada automaticamente pelo Sistema IPME</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedCode ? 'Código Copiado!' : 'Copiar Código PIN'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
            
            {onConfirmNow && (
              <button
                type="button"
                onClick={handleImmediateActivation}
                disabled={confirming}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{confirming ? 'Ativando...' : 'Ativar Imediatamente (Simular Confirmação)'}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
