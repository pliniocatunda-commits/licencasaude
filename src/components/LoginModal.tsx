import React, { useState } from 'react';
import { AppUser } from '../types/index.ts';
import { 
  X, 
  Lock, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { signInWithGoogle } from '../services/googleAuth.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, name?: string, provider?: 'google' | 'corporate', password?: string) => Promise<void>;
  currentUser: AppUser;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Master fallback state
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [showMasterPassForm, setShowMasterPassForm] = useState(false);
  const [masterPass, setMasterPass] = useState('IpmeMaster@2026');
  const [showMasterPass, setShowMasterPass] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  if (!isOpen) return null;

  const handleCorporateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Informe seu email corporativo.');
      return;
    }
    setLoading(true);
    try {
      await onLogin(email.trim().toLowerCase(), name.trim() || email.split('@')[0], 'corporate', password);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMasterLogin = async () => {
    setLoading(true);
    setError('');
    setUnauthorizedDomain(null);
    try {
      const googleUser = await signInWithGoogle();
      const authenticatedEmail = (googleUser.email || '').trim().toLowerCase();
      if (authenticatedEmail !== 'pliniocatunda@gmail.com') {
        throw new Error(
          `Apenas a conta Google oficial do Administrador Master (pliniocatunda@gmail.com) tem acesso. A conta ${googleUser.email} não tem autorização.`
        );
      }
      await onLogin('Pliniocatunda@gmail.com', googleUser.displayName || 'Plínio Catunda (Admin Master)', 'google');
      onClose();
    } catch (err: any) {
      const isUnauthorizedDomain = err.code === 'auth/unauthorized-domain' || 
        (err.message && err.message.includes('auth/unauthorized-domain'));

      if (isUnauthorizedDomain) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
        setUnauthorizedDomain(host);
        setShowMasterPassForm(true);
        setError(`O domínio "${host}" ainda não está autorizado no Firebase Authentication. Você pode acessar com a senha Master abaixo.`);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela do Google foi fechada antes de concluir.');
      } else {
        setError(err.message || 'Erro ao autenticar via Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMasterPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPass) {
      setError('Informe a senha do Administrador Master.');
      return;
    }
    setLoading(true);
    try {
      await onLogin('Pliniocatunda@gmail.com', 'Plínio Catunda (Admin Master)', 'corporate', masterPass.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Senha incorreta para Administrador Master.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDomain = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.hostname).then(() => {
        setCopiedDomain(true);
        setTimeout(() => setCopiedDomain(false), 3000);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F223D]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#BED4EF] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#3868A0] text-white flex items-center justify-between border-b border-[#2B5485]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-100" />
            <h2 className="text-sm font-bold">
              Autenticação de Acesso · IPME
            </h2>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Master Google Login Option */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              1. Conta Master Administrador Geral (Google Login)
            </span>
            <button
              type="button"
              onClick={handleGoogleMasterLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold border border-slate-300 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Conectar como Master (Pliniocatunda@gmail.com)</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Superusuário com plenos poderes de exclusão, permissões e conformidade.
            </p>

            {/* Unauthorized Domain Alert */}
            {unauthorizedDomain && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Domínio pendente no Firebase Auth</span>
                </div>
                <div className="flex items-center justify-between gap-1 p-1 bg-white border border-amber-300 rounded">
                  <code className="text-[9px] font-mono text-amber-950 truncate">{unauthorizedDomain}</code>
                  <button
                    type="button"
                    onClick={handleCopyDomain}
                    className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[9px] font-bold rounded flex items-center gap-1"
                  >
                    {copiedDomain ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copiedDomain ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-[9px] text-amber-700">
                  Adicione em Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains.
                </p>
              </div>
            )}

            {/* Master Password Toggle / Form */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMasterPassForm(!showMasterPassForm)}
                className="w-full text-center text-[10px] text-[#2B5485] font-semibold underline cursor-pointer"
              >
                {showMasterPassForm ? 'Ocultar senha Master' : 'Ou entrar com Senha Master de Contingência'}
              </button>

              {showMasterPassForm && (
                <form onSubmit={handleMasterPasswordLogin} className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showMasterPass ? 'text' : 'password'}
                      required
                      value={masterPass}
                      onChange={e => setMasterPass(e.target.value)}
                      placeholder="Senha Master (IpmeMaster@2026)"
                      className="w-full pl-8 pr-8 py-1.5 bg-white border border-slate-200 rounded text-slate-900 text-[11px] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterPass(!showMasterPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showMasterPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Entrar como Master com Senha</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-[10px] uppercase font-bold tracking-wider">OU</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Corporate Email Login */}
          <form onSubmit={handleCorporateLogin} className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              2. Autenticação de Operador (E-mail Corporativo do Órgão)
            </span>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                E-mail Corporativo Institucional *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operador@eusebio.ce.gov.br"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3868A0] font-mono text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                O e-mail deve estar previamente cadastrado pelo Administrador.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Senha de Acesso *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha cadastrada"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3868A0] text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#3868A0] hover:bg-[#2B5485] text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              <span>{loading ? 'Validando...' : 'Acessar com E-mail Corporativo'}</span>
            </button>
          </form>

          {/* Current Session Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px]">
            <span>Sessão atual: </span>
            <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.email}) ·{' '}
            <span className="font-mono text-emerald-800 uppercase font-semibold">{currentUser.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
