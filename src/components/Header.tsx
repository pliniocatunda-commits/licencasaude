import React, { useState } from 'react';
import { AppUser, UserRole } from '../types/index.ts';
import { useAppTheme } from '../context/ThemeContext.tsx';
import { ThemeSelectorModal } from './ThemeSelectorModal.tsx';
import { 
  Building2, 
  Users, 
  FileText, 
  History, 
  ShieldCheck, 
  LogOut, 
  UserCheck, 
  ChevronDown,
  CheckCircle2,
  Lock,
  Plus,
  Landmark,
  FileSpreadsheet,
  Stethoscope,
  Layers,
  Upload,
  Palette
} from 'lucide-react';

interface HeaderProps {
  currentUser: AppUser;
  activeTab: 'dashboard' | 'employees' | 'secretarias' | 'doctors' | 'occurrences' | 'audit' | 'users';
  setActiveTab: (tab: 'dashboard' | 'employees' | 'secretarias' | 'doctors' | 'occurrences' | 'audit' | 'users') => void;
  onOpenNewOccurrence: () => void;
  onOpenNewEmployee: () => void;
  onOpenExecutiveReport?: () => void;
  onOpenImportCsv?: () => void;
  onSwitchUser: (user: AppUser) => void;
  onOpenLoginModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenNewOccurrence,
  onOpenNewEmployee,
  onOpenExecutiveReport,
  onOpenImportCsv,
  onSwitchUser,
  onOpenLoginModal,
}) => {
  const { theme, themeConfig } = useAppTheme();
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cadastrosDropdownOpen, setCadastrosDropdownOpen] = useState(false);
  const [licencasDropdownOpen, setLicencasDropdownOpen] = useState(false);

  const isCadastrosActive = ['employees', 'secretarias', 'doctors'].includes(activeTab);
  const isLicencasActive = activeTab === 'occurrences';

  const getActiveCadastroLabel = () => {
    if (activeTab === 'employees') return 'Servidores';
    if (activeTab === 'secretarias') return 'Secretarias';
    if (activeTab === 'doctors') return 'Médicos';
    return null;
  };

  const getActiveLicencaLabel = () => {
    if (activeTab === 'occurrences') return 'Ocorrências';
    return null;
  };

  const demoAccounts: { label: string; email: string; name: string; role: UserRole; provider: 'google' | 'corporate'; dept: string }[] = [
    {
      label: 'Admin Geral (Google Master)',
      email: 'Pliniocatunda@gmail.com',
      name: 'Plínio Catunda',
      role: 'admin',
      provider: 'google',
      dept: 'IPME Presidência & Governança',
    },
    {
      label: 'Médico Perito Oficial (Operador)',
      email: 'medico.perito@eusebio.ce.gov.br',
      name: 'Dr. Marcelo Cavalcante',
      role: 'operator',
      provider: 'corporate',
      dept: 'Junta Médica Pericial IPME',
    },
    {
      label: 'Analista de RH (Operador)',
      email: 'rh.operador@eusebio.ce.gov.br',
      name: 'Mariana Vasconcelos',
      role: 'operator',
      provider: 'corporate',
      dept: 'Recursos Humanos Previdenciários',
    },
  ];

  return (
    <header className={`sticky top-0 z-30 ${themeConfig.headerClass} border-b ${themeConfig.headerBorderClass} transition-colors duration-200`}>
      {/* Institutional Top Strip */}
      <div className={`${themeConfig.topStripClass} px-4 py-1 border-b ${themeConfig.topStripBorderClass} text-xs ${themeConfig.topStripTextClass} flex items-center justify-between transition-colors`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide uppercase text-[11px] opacity-90">
            Prefeitura Municipal de Eusébio · Ceará
          </span>
          <span className="opacity-40">|</span>
          <span className="opacity-80">
            IPME - Instituto de Previdência do Município de Eusébio
          </span>
        </div>
        <div className="flex items-center gap-2.5 font-mono text-[11px]">
          {/* Botão de Trocar Tema Direto no Topo */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-all cursor-pointer border border-current/20 active:scale-95 shadow-2xs"
            title="Clique para testar e mudar a cor do sistema"
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tema: <strong>{themeConfig.name}</strong></span>
          </button>
          <span className="hidden sm:inline opacity-70">Homologação</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Main Top Bar (Order of Resolution: 3-Zone Contract) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark / Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-800 flex items-center justify-center shrink-0 shadow">
            <img 
              src="/src/assets/images/ipme_seal_logo_1790337165041.jpg" 
              alt="Brasão Oficial IPME" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-base font-bold tracking-tight font-sans ${themeConfig.brandTextClass}`}>
                IPME Eusébio
              </span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-900/90 text-emerald-300 border border-emerald-700/50">
                Previdência
              </span>
            </div>
            <p className={`text-[11px] leading-none mt-0.5 ${themeConfig.brandSubtextClass}`}>
              Licenças Médicas & Readaptação Funcional
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className={`hidden md:flex items-center gap-1.5 font-medium text-sm ${themeConfig.navTextClass}`}>
          {/* 1. Painel */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setCadastrosDropdownOpen(false);
              setLicencasDropdownOpen(false);
            }}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? themeConfig.navActiveBgClass
                : themeConfig.navHoverClass
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Painel</span>
          </button>

          {/* 2. MENU DROPDOWN DE CADASTROS */}
          <div className="relative">
            <button
              onClick={() => {
                setCadastrosDropdownOpen(!cadastrosDropdownOpen);
                setLicencasDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                isCadastrosActive
                  ? themeConfig.navActiveBgClass
                  : themeConfig.navHoverClass
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Layers className={`w-4 h-4 shrink-0 ${isCadastrosActive ? 'text-sky-400' : 'opacity-70'}`} />
                <span>Cadastros</span>
                {getActiveCadastroLabel() && (
                  <span className="text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-400/30 px-1.5 py-0.5 rounded leading-none">
                    {getActiveCadastroLabel()}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 opacity-70 transition-transform duration-200 ${cadastrosDropdownOpen ? 'rotate-180 opacity-100' : ''}`} />
            </button>

            {/* Dropdown Menu Box - Cadastros */}
            {cadastrosDropdownOpen && (
              <div 
                className={`absolute left-0 mt-2 w-64 rounded-xl ${themeConfig.dropdownBgClass} border ${themeConfig.dropdownBorderClass} z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100`}
                onMouseLeave={() => setCadastrosDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 mb-1">
                  Módulos de Cadastro
                </div>

                {/* 1. Servidores */}
                <button
                  onClick={() => {
                    setActiveTab('employees');
                    setCadastrosDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'employees'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Servidores Ativos</span>
                      {activeTab === 'employees' && <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Quadro funcional e servidores
                    </p>
                  </div>
                </button>

                {/* 2. Secretarias */}
                <button
                  onClick={() => {
                    setActiveTab('secretarias');
                    setCadastrosDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'secretarias'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0">
                    <Landmark className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Secretarias & Órgãos</span>
                      {activeTab === 'secretarias' && <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Pastas municipais de lotação
                    </p>
                  </div>
                </button>

                {/* 3. Médicos Peritos */}
                <button
                  onClick={() => {
                    setActiveTab('doctors');
                    setCadastrosDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'doctors'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Médicos Peritos</span>
                      {activeTab === 'doctors' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Registro de CRM e junta oficial
                    </p>
                  </div>
                </button>

                {/* 4. Importador CSV */}
                {onOpenImportCsv && (
                  <>
                    <div className="my-1 border-t border-slate-800"></div>
                    <button
                      onClick={() => {
                        onOpenImportCsv();
                        setCadastrosDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-emerald-300 flex items-center justify-between">
                          <span>Importar CSV</span>
                          <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-1 py-0.2 rounded font-mono font-bold">Oficial</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          Servidores & secretarias
                        </p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 3. MENU DROPDOWN DE LICENÇAS E READAPTAÇÕES */}
          <div className="relative">
            <button
              onClick={() => {
                setLicencasDropdownOpen(!licencasDropdownOpen);
                setCadastrosDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
                isLicencasActive
                  ? themeConfig.navActiveBgClass
                  : themeConfig.navHoverClass
              }`}
            >
              <div className="flex items-center gap-1.5">
                <FileText className={`w-4 h-4 shrink-0 ${isLicencasActive ? 'text-amber-400' : 'opacity-70'}`} />
                <span>Licenças e Readaptações</span>
                {getActiveLicencaLabel() && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-400/30 px-1.5 py-0.5 rounded leading-none">
                    {getActiveLicencaLabel()}
                  </span>
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 shrink-0 opacity-70 transition-transform duration-200 ${licencasDropdownOpen ? 'rotate-180 opacity-100' : ''}`} />
            </button>

            {/* Dropdown Menu Box - Licenças e Readaptações */}
            {licencasDropdownOpen && (
              <div 
                className={`absolute left-0 mt-2 w-72 rounded-xl ${themeConfig.dropdownBgClass} border ${themeConfig.dropdownBorderClass} z-50 overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100`}
                onMouseLeave={() => setLicencasDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 mb-1">
                  Gestão Pericial & Afastamentos
                </div>

                {/* 1. Licenças e readaptações */}
                <button
                  onClick={() => {
                    setActiveTab('occurrences');
                    setLicencasDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'occurrences'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Licenças & Readaptações</span>
                      {activeTab === 'occurrences' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Listagem e gestão de afastamentos
                    </p>
                  </div>
                </button>

                {/* 2. Nova Ocorrência */}
                <button
                  onClick={() => {
                    onOpenNewOccurrence();
                    setLicencasDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-3 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Nova Ocorrência</span>
                      <span className="text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded">
                        Novo +
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Cadastrar nova licença médica
                    </p>
                  </div>
                </button>

                {/* 3. Auditoria */}
                <button
                  onClick={() => {
                    setActiveTab('audit');
                    setLicencasDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Trilha de Auditoria</span>
                      {activeTab === 'audit' && <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">
                      Histórico e conformidade pericial
                    </p>
                  </div>
                </button>

                {/* 4. Relatório Executivo */}
                {onOpenExecutiveReport && (
                  <button
                    onClick={() => {
                      onOpenExecutiveReport();
                      setLicencasDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-3 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors cursor-pointer border-t border-slate-800/70 mt-1 pt-2"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white flex items-center justify-between">
                        <span>Relatório Executivo</span>
                        <span className="text-[9px] font-bold bg-blue-950 text-blue-300 border border-blue-700/50 px-1.5 py-0.5 rounded">
                          A4 Paisagem
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        Painel gerencial e download PDF
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. HISTÓRICO & TRILHA DE AUDITORIA (BOTÃO DIRETO NO CABEÇALHO) */}
          <button
            onClick={() => {
              setActiveTab('audit');
              setCadastrosDropdownOpen(false);
              setLicencasDropdownOpen(false);
            }}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? theme === 'light'
                  ? 'bg-purple-100 text-purple-900 font-bold border border-purple-300 shadow-xs'
                  : 'bg-slate-800 text-purple-300 font-bold border border-purple-500/50 shadow-xs'
                : themeConfig.navHoverClass
            }`}
            title="Trilha de Auditoria e Histórico Completo de Alterações"
          >
            <History className={`w-4 h-4 shrink-0 ${activeTab === 'audit' ? 'text-purple-400' : 'opacity-70'}`} />
            <span>Histórico / Trilha</span>
          </button>

          {/* 5. Acessos (Admin) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => {
                setActiveTab('users');
                setCadastrosDropdownOpen(false);
                setLicencasDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? themeConfig.navActiveBgClass
                  : themeConfig.navHoverClass
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Acessos</span>
            </button>
          )}
        </nav>

        {/* Zone 3: User Profile & Theme Switcher */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Switcher Button */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${
              theme === 'light'
                ? 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Mudar paleta de cores do sistema (Verde, Branco Clean, Grafite, etc.)"
          >
            <Palette className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Cores</span>
          </button>

          {/* User Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`flex items-center gap-2.5 p-1.5 rounded-lg transition-colors text-left border ${themeConfig.profileBtnHoverClass} ${themeConfig.profileBtnBorderClass}`}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700 border border-emerald-400/30 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                {currentUser.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-semibold truncate max-w-[120px] ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                    currentUser.role === 'admin' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  }`}>
                    {currentUser.role === 'admin' ? 'Admin' : 'Operador'}
                  </span>
                </div>
                <p className={`text-[10px] truncate max-w-[140px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {currentUser.email}
                </p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
            </button>

            {/* Profile Menu Dropdown */}
            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 text-slate-200"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{currentUser.department}</span>
                  </div>
                  <div className="mt-2 text-[10px] bg-slate-800 p-1.5 rounded text-slate-300">
                    <span className="font-semibold text-white">Nível de Permissão:</span>{' '}
                    {currentUser.role === 'admin' 
                      ? 'Superusuário Admin (Acesso Total, Exclusão e RBAC)' 
                      : 'Operador Pericial (Leitura, Escrita, Prorrogação e Conclusão)'}
                  </div>
                </div>

                {/* Theme Selector Option inside Profile */}
                <div className="p-2 border-b border-slate-800">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setThemeModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-emerald-300 hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-semibold block text-white">Mudar Cores do Sistema</span>
                        <span className="text-[10px] text-slate-400">Ativo: {themeConfig.name}</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                      Trocar
                    </span>
                  </button>
                </div>

                {/* Role Switcher for Rapid Verification & Testing */}
                <div className="px-4 py-2 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Alternar Conta / Perfil (Simulação)
                </div>

                {demoAccounts.map(acc => (
                  <button
                    key={acc.email}
                    onClick={() => {
                      onSwitchUser({
                        id: `user_${acc.email}`,
                        email: acc.email,
                        name: acc.name,
                        role: acc.role,
                        auth_provider: acc.provider,
                        department: acc.dept,
                        created_at: new Date().toISOString(),
                      });
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      currentUser.email.toLowerCase() === acc.email.toLowerCase() ? 'bg-slate-800/80 text-emerald-300 font-medium' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.email}</p>
                    </div>
                    {currentUser.email.toLowerCase() === acc.email.toLowerCase() ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">
                        {acc.role}
                      </span>
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-800 mt-2 pt-2 px-2">
                  <button
                    onClick={onOpenLoginModal}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Autenticar com Outro Email / Google</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800 px-1 py-2 bg-slate-900/95 text-[11px] overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${activeTab === 'dashboard' ? 'text-emerald-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Painel
        </button>
        <button
          onClick={() => setActiveTab('occurrences')}
          className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${activeTab === 'occurrences' ? 'text-amber-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Licenças
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${activeTab === 'employees' ? 'text-sky-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Servidores
        </button>
        <button
          onClick={() => setActiveTab('secretarias')}
          className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${activeTab === 'secretarias' ? 'text-teal-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Secretarias
        </button>
        <button
          onClick={() => setActiveTab('doctors')}
          className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${activeTab === 'doctors' ? 'text-emerald-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Médicos
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${activeTab === 'audit' ? 'text-purple-400 font-bold bg-slate-800' : 'text-slate-400'}`}
        >
          Histórico / Trilha
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-2 py-1 rounded whitespace-nowrap cursor-pointer ${activeTab === 'users' ? 'text-emerald-400 font-bold bg-slate-800' : 'text-slate-400'}`}
          >
            Acessos
          </button>
        )}
      </div>
      {/* Theme Selector Modal */}
      <ThemeSelectorModal 
        isOpen={themeModalOpen} 
        onClose={() => setThemeModalOpen(false)} 
      />
    </header>
  );
};
