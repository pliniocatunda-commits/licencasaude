import React, { useState } from 'react';
import { AppUser } from '../types/index.ts';
import { ActivateAccountModal } from './ActivateAccountModal.tsx';
import { api } from '../services/api.ts';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Stethoscope, 
  FileBadge, 
  KeyRound, 
  Info,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, name?: string, provider?: 'google' | 'corporate', password?: string) => Promise<void>;
  loading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  loading: externalLoading = false,
}) => {
  const [corporateEmail, setCorporateEmail] = useState('');
  const [corporatePassword, setCorporatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  // Activation modal state
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [activationEmail, setActivationEmail] = useState('');
  const [activationCode, setActivationCode] = useState('');

  const isLoading = externalLoading || localLoading;

  // 1. Google Master Login (Plínio Catunda - pliniocatunda@gmail.com)
  const handleGoogleMasterLogin = async () => {
    setError('');
    setSuccessMsg('');
    setLocalLoading(true);
    try {
      await onLogin('Pliniocatunda@gmail.com', 'Plínio Catunda (Admin Master)', 'google');
      setSuccessMsg('Autenticação Google concluída com sucesso! Redirecionando...');
    } catch (err) {
      setError((err as Error).message || 'Erro ao autenticar com a conta Google Master.');
    } finally {
      setLocalLoading(false);
    }
  };

  // 2. Corporate Operator Login
  const handleCorporateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const emailTrim = corporateEmail.trim().toLowerCase();
    if (!emailTrim) {
      setError('Por favor, informe seu e-mail corporativo institucional.');
      return;
    }

    if (!corporatePassword) {
      setError('Por favor, informe a senha cadastrada para seu e-mail corporativo.');
      return;
    }

    setLocalLoading(true);
    try {
      await onLogin(emailTrim, undefined, 'corporate', corporatePassword);
      setSuccessMsg(`Autenticação corporativa confirmada para ${emailTrim}! Entrando...`);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login corporativo. Verifique e-mail e senha.');
    } finally {
      setLocalLoading(false);
    }
  };

  // Helper to fill demo operator
  const handleFillDemo = (email: string, pass: string) => {
    setCorporateEmail(email);
    setCorporatePassword(pass);
    setError('');
  };

  const handleConfirmEmailApi = async (email: string, code: string) => {
    await api.confirmEmail(email, code);
  };

  const handleResendEmailApi = async (email: string) => {
    return await api.resendConfirmationEmail(email);
  };

  const handleSuccessActivatedLogin = async (email: string) => {
    setCorporateEmail(email);
    if (corporatePassword && corporatePassword.trim()) {
      try {
        await onLogin(email, undefined, 'corporate', corporatePassword.trim());
      } catch {
        setSuccessMsg(`Cadastro e e-mail confirmados com sucesso para ${email}! Digite sua senha cadastrada para entrar.`);
      }
    } else {
      setSuccessMsg(`Cadastro e e-mail confirmados com sucesso para ${email}! Digite sua senha cadastrada para entrar.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1A2F] via-[#102A4C] to-[#1B3F6E] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Banner / Brasão */}
      <header className="border-b border-white/10 bg-[#0B1A2F]/70 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
              <img 
                src="/src/assets/images/ipme_seal_logo_1790337165041.jpg" 
                alt="Brasão IPME Eusébio" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-sm sm:text-base">IPME</span>
                <span className="text-white/40">·</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-100">Instituto de Previdência do Município de Eusébio</span>
              </div>
              <p className="text-[10px] text-blue-200/70 font-mono hidden sm:block">
                RPPS Eusébio · Autarquia Municipal Criada pela Lei nº 465/2002 · Ceará
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ambiente Autenticado</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl space-y-6">
          
          {/* Hero Titles */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/15 text-blue-100 mb-1">
              <FileBadge className="w-3.5 h-3.5 text-amber-300" />
              <span>Sistema Oficial de Licenças Médicas & Readaptações</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Portal Integrado de Acesso Seguro
            </h1>
            <p className="text-xs sm:text-sm text-blue-200/80 max-w-xl mx-auto">
              Identifique-se com sua conta Master Google ou com seu e-mail institucional corporativo e senha cadastrados.
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="p-3.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-start justify-between gap-2.5 shadow-lg animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-red-300">Atenção ao Acesso:</span>
                  <p className="text-[11px] leading-relaxed text-red-200/90">{error}</p>
                </div>
              </div>
              {error.includes('pendente de confirmação') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivationEmail(corporateEmail);
                    setActivateModalOpen(true);
                  }}
                  className="px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-[11px] cursor-pointer whitespace-nowrap"
                >
                  Ativar Conta Agora
                </button>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Cards Grid: Master (Google) vs Operators (Corporate) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* 1. MASTER GOOGLE ACCOUNT CARD */}
            <div className="bg-[#132A4B]/80 backdrop-blur-md rounded-2xl border-2 border-amber-500/40 hover:border-amber-500/70 p-6 sm:p-7 shadow-2xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Lock className="w-3 h-3 text-amber-300" />
                    <span>Administrador Master</span>
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-mono">Google Auth 1P</span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Acesso Master Geral</span>
                  </h2>
                  <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
                    Acesso exclusivo e permanente do Administrador do IPME, vinculado à conta Google oficial.
                  </p>
                </div>

                {/* Account Details Box */}
                <div className="p-3.5 rounded-xl bg-[#0C1E37] border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-bold text-amber-300 text-xs">
                      PC
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Plínio Catunda</div>
                      <div className="text-[11px] font-mono text-amber-300 font-semibold">
                        pliniocatunda@gmail.com
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-blue-200/70">
                    <span>Perfil: Administrador Geral (Total)</span>
                    <span className="text-emerald-400 font-semibold">● Conta Vinculada</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-blue-200/80">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Controle total de permissões e cadastro de operadores</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Auditoria de conformidade, relatórios e exclusões</span>
                  </div>
                </div>
              </div>

              {/* Master Button */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleGoogleMasterLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 hover:shadow-amber-500/20"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>{isLoading ? 'Conectando ao Google...' : 'Acessar com Google (Administrador Master)'}</span>
                </button>
                <p className="text-[10px] text-center text-blue-200/60 mt-2 font-mono">
                  Superusuário autenticado com plenos poderes
                </p>
              </div>
            </div>

            {/* 2. CORPORATE OPERATOR ACCOUNT CARD */}
            <div className="bg-[#132A4B]/80 backdrop-blur-md rounded-2xl border border-sky-400/30 hover:border-sky-400/60 p-6 sm:p-7 shadow-2xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    <UserCheck className="w-3 h-3 text-sky-300" />
                    <span>Usuários Operadores</span>
                  </span>
                  <span className="text-[10px] text-sky-200/70 font-mono">E-mail + Senha</span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Acesso de Operadores</span>
                  </h2>
                  <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
                    Para peritos médicos e analistas de RH credenciados pelo Administrador com e-mail institucional e senha.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleCorporateLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      E-mail Corporativo do Órgão *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={corporateEmail}
                        onChange={e => setCorporateEmail(e.target.value)}
                        placeholder="operador@eusebio.ce.gov.br"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#0C1E37] border border-white/20 rounded-xl text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Senha de Acesso *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={corporatePassword}
                        onChange={e => setCorporatePassword(e.target.value)}
                        placeholder="Informe sua senha cadastrada"
                        className="w-full pl-9 pr-9 py-2.5 bg-[#0C1E37] border border-white/20 rounded-xl text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isLoading ? 'Autenticando...' : 'Acessar com E-mail e Senha'}</span>
                  </button>
                </form>

                {/* Quick demo helper toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDemoHelp(!showDemoHelp)}
                    className="text-[11px] text-sky-300 hover:text-sky-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>{showDemoHelp ? 'Ocultar operadores de demonstração' : 'Ver operadores e senhas de teste'}</span>
                  </button>

                  {showDemoHelp && (
                    <div className="mt-2 p-2.5 bg-[#0C1E37] border border-sky-500/20 rounded-xl space-y-1.5 animate-in fade-in text-[11px]">
                      <div className="text-[10px] text-blue-200/60 font-semibold uppercase">
                        Clique para preencher login e senha:
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFillDemo('medico.perito@eusebio.ce.gov.br', 'Perito@2026')}
                        className="w-full text-left p-1.5 rounded hover:bg-white/10 flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-white">Dr. Marcelo Cavalcante Holanda</p>
                          <p className="text-[10px] text-sky-300 font-mono">medico.perito@eusebio.ce.gov.br</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-300 font-mono block">Senha: Perito@2026</span>
                          <span className="text-[10px] text-sky-200/60">Perito Médico</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillDemo('rh.operador@eusebio.ce.gov.br', 'RhOperador@2026')}
                        className="w-full text-left p-1.5 rounded hover:bg-white/10 flex items-center justify-between text-slate-200 transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="font-semibold text-white">Mariana Vasconcelos de Albuquerque</p>
                          <p className="text-[10px] text-sky-300 font-mono">rh.operador@eusebio.ce.gov.br</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-300 font-mono block">Senha: RhOperador@2026</span>
                          <span className="text-[10px] text-sky-200/60">RH Benefícios</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-blue-200/60 flex items-center justify-between font-mono">
                <span>Domínio oficial: @eusebio.ce.gov.br</span>
                <span className="text-emerald-400/90 flex items-center gap-1 font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Acesso Direto Ativo
                </span>
              </div>
            </div>

          </div>

          {/* Footer security badges */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-blue-200/60">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-300" />
                <span>Prefeitura Municipal de Eusébio - Ceará</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
                <span>Junta Médica Oficial do IPME</span>
              </span>
            </div>

            <div className="text-[11px] font-mono">
              Segurança Baseada em Papéis (RBAC) & Conformidade RPPS
            </div>
          </div>

        </div>
      </main>

      {/* Institutional Bottom Banner */}
      <footer className="border-t border-white/10 bg-[#0B1A2F]/80 backdrop-blur-md px-4 py-3 text-center text-[11px] text-blue-200/50">
        <p>
          IPME · Rua Irmã Ambrosina, nº 83 - Centro, Eusébio - CE · CEP: 61.760-000 · Tel: (85) 3260-1234
        </p>
      </footer>

      {/* Activate Account Modal */}
      <ActivateAccountModal
        isOpen={activateModalOpen}
        onClose={() => setActivateModalOpen(false)}
        initialEmail={activationEmail}
        initialCode={activationCode}
        onConfirmEmail={handleConfirmEmailApi}
        onResendEmail={handleResendEmailApi}
        onSuccessLogin={handleSuccessActivatedLogin}
      />
    </div>
  );
};
