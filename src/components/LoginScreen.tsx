import React, { useState, useEffect } from 'react';
import { useAppTheme } from '../context/ThemeContext.tsx';
import { signInWithGoogle } from '../services/googleAuth.ts';
import { TenantInfo } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  UserCheck, 
  CheckCircle2, 
  KeyRound, 
  Info,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Landmark
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, name?: string, provider?: 'google' | 'corporate', password?: string, tenantId?: string) => Promise<void>;
  loading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  loading: externalLoading = false,
}) => {
  const { theme, themeConfig } = useAppTheme();

  // Mode selection: 'corporate' (for operators) or 'master' (for Plínio Catunda / Admin Master via Google)
  const [loginMode, setLoginMode] = useState<'corporate' | 'master'>('corporate');

  // Tenants list for multi-tenant routing
  const [tenantsList, setTenantsList] = useState<TenantInfo[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => api.getActiveTenantId());

  useEffect(() => {
    let isMounted = true;
    api.getTenants().then(list => {
      if (isMounted && list && list.length > 0) {
        setTenantsList(list);
        if (!list.some(t => t.id === selectedTenantId)) {
          setSelectedTenantId(list[0].id);
        }
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Corporate credentials state
  const [corporateEmail, setCorporateEmail] = useState('');
  const [corporatePassword, setCorporatePassword] = useState('');
  const [showCorporatePassword, setShowCorporatePassword] = useState(false);

  // Master state
  const [showMasterPasswordFallback, setShowMasterPasswordFallback] = useState(false);
  const [masterPassword, setMasterPassword] = useState('IpmeMaster@2026');
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const handleCopyOrigin = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.origin).then(() => {
        setCopiedOrigin(true);
        setTimeout(() => setCopiedOrigin(false), 3000);
      });
    }
  };

  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  const isLoading = externalLoading || localLoading;

  // 1. Corporate Operator Login (Institutional email + password + assigned tenant)
  const handleCorporateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailTrim = corporateEmail.trim().toLowerCase();
    if (!emailTrim) {
      setError('Por favor, informe seu e-mail corporativo.');
      return;
    }
    if (!corporatePassword || !corporatePassword.trim()) {
      setError('Por favor, informe sua senha cadastrada.');
      return;
    }

    setLocalLoading(true);
    try {
      await onLogin(emailTrim, undefined, 'corporate', corporatePassword.trim(), selectedTenantId);
      setSuccessMsg(`Autenticado com sucesso como ${emailTrim}! Entrando no sistema...`);
    } catch (err: any) {
      setError(err.message || 'Senha incorreta ou e-mail corporativo não cadastrado. Verifique os dados e tente novamente.');
    } finally {
      setLocalLoading(false);
    }
  };

  // 2. Real Google Master Login (strictly linked to pliniocatunda@gmail.com without password)
  const handleGoogleMasterLogin = async () => {
    setError('');
    setSuccessMsg('');
    setUnauthorizedDomain(null);
    setLocalLoading(true);
    try {
      // 1. Trigger real Google popup via Firebase Auth & Google Identity
      const googleUser = await signInWithGoogle();
      const authenticatedEmail = (googleUser.email || '').trim().toLowerCase();

      // 2. Verify account matches pliniocatunda@gmail.com
      if (authenticatedEmail !== 'pliniocatunda@gmail.com') {
        throw new Error(
          `Acesso não autorizado: você autenticou como "${googleUser.email}". O acesso de Administrador Master é restrito exclusivamente à conta Google oficial: pliniocatunda@gmail.com.`
        );
      }

      // 3. Log in without password
      await onLogin(
        'Pliniocatunda@gmail.com',
        googleUser.displayName || 'Plínio Catunda (Administrador Master)',
        'google'
      );
      setSuccessMsg('Autenticação Google confirmada com sucesso! Entrando no sistema...');
    } catch (err: any) {
      const isUserClosure = 
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request';

      if (!isUserClosure) {
        console.warn('Google Sign-In notice:', err?.message || err);
      } else {
        console.info('Google popup window was closed by user.');
      }

      const isUnauthorizedDomain = err?.code === 'auth/unauthorized-domain' || 
        (err?.message && err.message.includes('auth/unauthorized-domain'));

      if (isUnauthorizedDomain) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'este domínio';
        setUnauthorizedDomain(currentHost);
        setError(`O domínio "${currentHost}" não está na lista de domínios autorizados do Firebase Authentication. Utilize a senha Master abaixo para acesso imediato.`);
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setError('A janela de login do Google foi fechada antes de concluir a autenticação.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('O navegador bloqueou a janela pop-up do Google. Por favor, habilite pop-ups para este site.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError('Tentativa de autenticação cancelada.');
      } else {
        setError(err?.message || 'Erro ao realizar autenticação com a conta Google.');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  // 3. Master Password Fallback Login (Guaranteed immediate access even if Google domain is pending)
  const handleMasterPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    const pass = masterPassword.trim();
    if (!pass) {
      setError('Por favor, informe a senha do Administrador Master.');
      return;
    }
    setLocalLoading(true);
    try {
      await onLogin('Pliniocatunda@gmail.com', 'Plínio Catunda (Administrador Master)', 'corporate', pass);
      setSuccessMsg('Autenticado com sucesso como Administrador Master! Entrando no sistema...');
    } catch (err: any) {
      setError(err.message || 'Senha incorreta para o Administrador Master.');
    } finally {
      setLocalLoading(false);
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

  // Helper to fill demo operator
  const handleFillDemo = (email: string, pass: string) => {
    setCorporateEmail(email);
    setCorporatePassword(pass);
    setError('');
  };

  // Dynamic button styles based on selected IPME theme
  const getThemeButtonClass = () => {
    switch (theme) {
      case 'azul_ipme_light':
        return 'bg-[#2B5485] hover:bg-[#1E426D] text-white shadow-sm';
      case 'azul_ipme_marinho':
        return 'bg-[#16325B] hover:bg-[#0F223D] text-white shadow-sm';
      case 'azul_ipme_celeste':
        return 'bg-[#2B6CB0] hover:bg-[#1E4B7A] text-white shadow-sm';
      case 'azul_ipme':
      default:
        return 'bg-[#3868A0] hover:bg-[#2B5485] text-white shadow-sm';
    }
  };

  const getThemeActiveTabClass = () => {
    switch (theme) {
      case 'azul_ipme_light':
        return 'bg-[#2B5485] text-white shadow-xs font-semibold';
      case 'azul_ipme_marinho':
        return 'bg-[#16325B] text-white shadow-xs font-semibold';
      case 'azul_ipme_celeste':
        return 'bg-[#2B6CB0] text-white shadow-xs font-semibold';
      case 'azul_ipme':
      default:
        return 'bg-[#3868A0] text-white shadow-xs font-semibold';
    }
  };

  const getThemeCardBorder = () => {
    switch (theme) {
      case 'azul_ipme_light':
        return 'border-[#C8DCF4]';
      case 'azul_ipme_marinho':
        return 'border-[#A8C8EE]';
      case 'azul_ipme_celeste':
        return 'border-[#93C5FD]';
      case 'azul_ipme':
      default:
        return 'border-[#BED4EF]';
    }
  };

  return (
    <div className={`min-h-screen ${themeConfig.pageBgClass} flex flex-col justify-between font-sans transition-colors duration-200 selection:bg-[#3868A0] selection:text-white`}>
      {/* Top Banner / Brasão Neutro Multi-Institucional */}
      <header className={`${themeConfig.headerClass} border-b ${themeConfig.headerBorderClass} px-4 sm:px-8 py-3.5 shadow-xs transition-colors`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shadow-xs overflow-hidden shrink-0 text-white">
              <Landmark className="w-5 h-5 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-extrabold tracking-tight text-sm sm:text-base ${theme === 'azul_ipme_light' ? 'text-[#2B5485]' : 'text-white'}`}>
                  PrevSaúde
                </span>
                <span className="opacity-40 text-white/50">·</span>
                <span className={`text-xs sm:text-sm font-semibold ${theme === 'azul_ipme_light' ? 'text-slate-700' : 'text-blue-100'}`}>
                  Sistema Integrado de Perícia Médica & Gestão Previdenciária
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ambiente Seguro</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container with SINGLE Login Box adhering to configured theme colors */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          
          {/* THE SINGLE UNIFIED LOGIN CARD */}
          <div className={`bg-white rounded-2xl border-2 ${getThemeCardBorder()} p-6 sm:p-8 shadow-xl relative overflow-hidden transition-all duration-200`}>
            
            {/* Top decorative badge - Neutro Multi-Cliente com Brasão Previdenciário */}
            <div className="text-center space-y-3 mb-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#16325B] via-[#204977] to-[#2B5485] border-2 border-blue-200/50 p-2.5 shadow-lg flex flex-col items-center justify-center text-white">
                  <Landmark className="w-10 h-10 text-sky-200" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 mt-0.5 font-sans">
                    PrevSaúde
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 rounded-full p-1 border-2 border-white shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Portal de Acesso Previdenciário
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Junta Médica & Gestão Integrada de Licenças e Readaptações
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${themeConfig.accentBadgeClass}`}>
                    <ShieldCheck className="w-3 h-3 text-[#3868A0]" />
                    <span>Acesso Corporativo Seguro</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mode Selector Tabs (Single Card Toggle) - Operador Corporativo Primeiro */}
            <div className="p-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('corporate');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMode === 'corporate'
                    ? getThemeActiveTabClass()
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Operador do Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('master');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMode === 'master'
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Master (Universal)</span>
              </button>
            </div>

            {/* Alert Messages inside the Card */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 shadow-2xs animate-in fade-in">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 shadow-2xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* TAB 1: CORPORATE OPERATOR LOGIN (Institutional email + password + tenant) - PRINCIPAL */}
            {loginMode === 'corporate' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                  Para médicos peritos e analistas com e-mail institucional e senha cadastrada.
                </p>

                <form onSubmit={handleCorporateLogin} className="space-y-3.5">
                  {/* Seletor do Município / Autarquia Cliente */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Autarquia / Cliente Municipal *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Base isolada</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={selectedTenantId}
                        onChange={e => setSelectedTenantId(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#3868A0] focus:border-transparent transition-all cursor-pointer font-medium"
                      >
                        {tenantsList.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.sigla} - {t.nome} ({t.cidade}/{t.uf})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail Corporativo *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={corporateEmail}
                        onChange={e => setCorporateEmail(e.target.value)}
                        placeholder="operador@eusebio.ce.gov.br"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#3868A0] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Senha de Acesso *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showCorporatePassword ? 'text' : 'password'}
                        required
                        value={corporatePassword}
                        onChange={e => setCorporatePassword(e.target.value)}
                        placeholder="Informe sua senha cadastrada"
                        className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#3868A0] focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCorporatePassword(!showCorporatePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title={showCorporatePassword ? 'Ocultar senha' : 'Exibir senha'}
                      >
                        {showCorporatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 ${getThemeButtonClass()}`}
                  >
                    <span>{isLoading ? 'Autenticando...' : 'Acessar com E-mail e Senha'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Switch to Master link */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('master');
                      setError('');
                    }}
                    className="text-[11px] text-[#2B5485] hover:text-[#1E426D] font-semibold underline cursor-pointer transition-colors"
                  >
                    É Administrador Geral? Clique aqui para acesso Google Master
                  </button>
                </div>

                {/* Collapsible Demo operators for fast evaluation */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowDemoHelp(!showDemoHelp)}
                    className="text-[11px] text-slate-500 hover:text-[#2B5485] flex items-center justify-center gap-1 mx-auto cursor-pointer transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-[#3868A0]" />
                    <span>{showDemoHelp ? 'Ocultar operadores de demonstração' : 'Ver operadores de teste pré-cadastrados'}</span>
                  </button>

                  {showDemoHelp && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-in fade-in text-[11px]">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Clique para preencher:
                      </div>

                      <button
                        type="button"
                        onClick={() => handleFillDemo('pliniocatunda@gmail.com', 'IpmeMaster@2026')}
                        className="w-full text-left p-1.5 rounded bg-amber-50/70 border border-amber-200 hover:bg-amber-100/70 flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-slate-900">Plínio Catunda</p>
                            <span className="text-[9px] uppercase font-bold bg-amber-200 text-amber-900 px-1 rounded">Master</span>
                          </div>
                          <p className="text-[10px] text-amber-800 font-mono">pliniocatunda@gmail.com</p>
                        </div>
                        <span className="text-[10px] text-amber-800 font-mono font-bold">IpmeMaster@2026</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillDemo('medico.perito@eusebio.ce.gov.br', 'Perito@2026')}
                        className="w-full text-left p-1.5 rounded hover:bg-slate-200/60 flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">Dr. Marcelo Cavalcante</p>
                          <p className="text-[10px] text-[#3868A0] font-mono">medico.perito@eusebio.ce.gov.br</p>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-mono font-medium">Perito@2026</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillDemo('rh.operador@eusebio.ce.gov.br', 'RhOperador@2026')}
                        className="w-full text-left p-1.5 rounded hover:bg-slate-200/60 flex items-center justify-between text-slate-700 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">Mariana Vasconcelos (RH)</p>
                          <p className="text-[10px] text-[#3868A0] font-mono">rh.operador@eusebio.ce.gov.br</p>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-mono font-medium">RhOperador@2026</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MASTER ADMIN LOGIN (PLÍNIO CATUNDA) - PRIORIDADE GOOGLE LOGIN */}
            {loginMode === 'master' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                        <Lock className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">Administrador Master Geral</span>
                        <span className="text-[10px] text-amber-800 font-mono">Vinculação à Conta Google</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      Superusuário
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-amber-200/60">
                    Acesso exclusivo vinculado diretamente à conta Google oficial <strong className="text-slate-900 font-mono">pliniocatunda@gmail.com</strong> sem necessidade de criar ou digitar senha do sistema.
                  </p>
                </div>

                {/* Card da Conta Google Autorizada */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-medium block">Conta Google Autorizada</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">pliniocatunda@gmail.com</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Master
                  </span>
                </div>

                {/* BOTÃO PRINCIPAL GOOGLE - Prioridade 1 Direta */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleGoogleMasterLogin}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border-2 border-slate-300 hover:border-slate-400 shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 group active:scale-98"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span className="text-slate-800 group-hover:text-slate-900 font-bold">
                      {isLoading ? 'Conectando à Conta Google...' : 'Entrar com Conta Google (pliniocatunda@gmail.com)'}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Ao clicar, o Google validará sua conta oficial em janela segura.
                  </p>
                </div>

                {/* Se houver aviso de domínio não autorizado no Firebase */}
                {unauthorizedDomain && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-left animate-in fade-in text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Configuração de Domínio no Firebase Authentication</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Para autorizar este domínio na autenticação Google, basta cadastrá-lo em <strong>Domínios autorizados</strong> no Firebase Console do projeto <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">gen-lang-client-0791870171</code>:
                    </p>
                    <div className="flex items-center justify-between gap-2 p-1.5 bg-white border border-amber-200 rounded-lg">
                      <span className="font-mono text-[11px] font-bold text-slate-800 truncate">
                        {unauthorizedDomain}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyDomain}
                        className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? 'Copiado!' : 'Copiar Domínio'}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0791870171/authentication/settings"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#2B5485] hover:underline font-bold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Configurações Firebase Auth</span>
                      </a>
                      <span className="text-slate-300">·</span>
                      <a
                        href="https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0791870171"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#2B5485] hover:underline font-bold"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Credenciais Google Cloud</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Opção de contingência: Senha Master (Secundária) */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowMasterPasswordFallback(!showMasterPasswordFallback)}
                    className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 py-1 cursor-pointer transition-colors"
                  >
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    <span>
                      {showMasterPasswordFallback
                        ? 'Ocultar login alternativo por Senha Master'
                        : 'Acesso alternativo com Senha Master de contingência'}
                    </span>
                  </button>

                  {showMasterPasswordFallback && (
                    <form onSubmit={handleMasterPasswordLogin} className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-in fade-in text-left">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">Senha Master do Titular:</span>
                        <button
                          type="button"
                          onClick={() => setMasterPassword('IpmeMaster@2026')}
                          className="text-[10px] text-amber-700 hover:text-amber-900 font-medium underline cursor-pointer"
                        >
                          Preencher padrão
                        </button>
                      </div>

                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showMasterPassword ? 'text' : 'password'}
                          required
                          value={masterPassword}
                          onChange={e => setMasterPassword(e.target.value)}
                          placeholder="Informe a senha Master"
                          className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMasterPassword(!showMasterPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={showMasterPassword ? 'Ocultar senha' : 'Exibir senha'}
                        >
                          {showMasterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Autenticando...' : 'Acessar com Senha Master'}</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Link para voltar ao Operador Corporativo */}
                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('corporate');
                      setError('');
                    }}
                    className="text-[11px] text-[#2B5485] hover:text-[#1E426D] font-semibold underline cursor-pointer transition-colors"
                  >
                    Acesso para operadores corporativos (médicos e analistas)
                  </button>
                </div>
              </div>
            )}

            {/* Card footer indicator */}
            <div className="mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>Plataforma Previdenciária Multi-Tenant</span>
              <span className="text-emerald-700 flex items-center gap-1 font-sans font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Sessão Segura & Auditada
              </span>
            </div>

          </div>

        </div>
      </main>

      {/* Institutional Bottom Banner styled with active theme */}
      <footer className={`${themeConfig.footerClass} border-t ${themeConfig.footerBorderClass} ${themeConfig.footerTextClass} px-4 py-3 text-center text-[11px] transition-colors`}>
        <p className="max-w-2xl mx-auto">
          Sistema Integrado de Perícia Médica & Gestão Previdenciária · Acesso Seguro, Segregado & Auditado
        </p>
      </footer>
    </div>
  );
};
