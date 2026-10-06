import React, { createContext, useContext, useState } from 'react';

export type AppTheme = 'azul_ipme' | 'azul_ipme_light' | 'verde' | 'grafite';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  subtitle: string;
  description: string;
  swatchColors: [string, string]; // [Primary / Deep, Accent / Swatch]
  headerClass: string;
  headerBorderClass: string;
  topStripClass: string;
  topStripTextClass: string;
  topStripBorderClass: string;
  brandTextClass: string;
  brandSubtextClass: string;
  navTextClass: string;
  navActiveBgClass: string;
  navActiveTextClass: string;
  navHoverClass: string;
  dropdownBgClass: string;
  dropdownBorderClass: string;
  dropdownItemHoverClass: string;
  profileBtnHoverClass: string;
  profileBtnBorderClass: string;
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  azul_ipme: {
    id: 'azul_ipme',
    name: 'Azul IPME Oficial',
    subtitle: 'Cor Oficial da Previdência IPME (Recomendado)',
    description: 'Tom azul cerúleo / cornflower oficial do IPME (#85AEE3 / #3868A0). Luminoso, elegante e representativo da previdência municipal.',
    swatchColors: ['#3868A0', '#85AEE3'],
    headerClass: 'bg-[#3868A0] text-white shadow-sm',
    headerBorderClass: 'border-[#2B5485]',
    topStripClass: 'bg-[#2B5485]',
    topStripTextClass: 'text-blue-100',
    topStripBorderClass: 'border-[#244973]',
    brandTextClass: 'text-white',
    brandSubtextClass: 'text-blue-100/90',
    navTextClass: 'text-blue-50',
    navActiveBgClass: 'bg-[#254C78] text-white border-[#5D8BBE]/80 shadow-xs font-semibold',
    navActiveTextClass: 'text-white',
    navHoverClass: 'hover:bg-[#2D588B] hover:text-white',
    dropdownBgClass: 'bg-[#315F95] text-white',
    dropdownBorderClass: 'border-[#254A75] shadow-2xl',
    dropdownItemHoverClass: 'hover:bg-[#254C78]',
    profileBtnHoverClass: 'hover:bg-[#2D588B]',
    profileBtnBorderClass: 'border-[#5D8BBE]/60',
  },
  azul_ipme_light: {
    id: 'azul_ipme_light',
    name: 'Azul IPME Clean & Branco',
    subtitle: 'Base Clara com Acentos no Azul IPME',
    description: 'Fundo branco puro super arejado com tipografia chumbo e divisores no azul oficial do IPME. Elimina qualquer bloco escuro pesado.',
    swatchColors: ['#FFFFFF', '#3868A0'],
    headerClass: 'bg-white text-slate-800 shadow-xs',
    headerBorderClass: 'border-[#C8DCF4]',
    topStripClass: 'bg-[#F0F5FC]',
    topStripTextClass: 'text-[#2B5485]',
    topStripBorderClass: 'border-[#D4E3F7]',
    brandTextClass: 'text-[#2B5485]',
    brandSubtextClass: 'text-slate-500',
    navTextClass: 'text-slate-600',
    navActiveBgClass: 'bg-[#EBF3FC] text-[#2B5485] border-[#97BDE8] shadow-xs font-semibold',
    navActiveTextClass: 'text-[#2B5485]',
    navHoverClass: 'hover:bg-[#F0F5FC] hover:text-[#2B5485]',
    dropdownBgClass: 'bg-white text-slate-800',
    dropdownBorderClass: 'border-[#C8DCF4] shadow-2xl',
    dropdownItemHoverClass: 'hover:bg-[#F0F5FC]',
    profileBtnHoverClass: 'hover:bg-[#F0F5FC]',
    profileBtnBorderClass: 'border-[#C8DCF4]',
  },
  verde: {
    id: 'verde',
    name: 'Verde Institucional',
    subtitle: 'Prefeitura & Junta Médica',
    description: 'Tons nobres de verde floresta e esmeralda, alinhados à bandeira do Município de Eusébio e à área da saúde.',
    swatchColors: ['#064e3b', '#10b981'],
    headerClass: 'bg-emerald-950 text-white shadow-sm',
    headerBorderClass: 'border-emerald-900',
    topStripClass: 'bg-[#022c22]',
    topStripTextClass: 'text-emerald-200',
    topStripBorderClass: 'border-emerald-900/80',
    brandTextClass: 'text-white',
    brandSubtextClass: 'text-emerald-300/80',
    navTextClass: 'text-emerald-100/90',
    navActiveBgClass: 'bg-emerald-900 text-white border-emerald-700/80 shadow-xs',
    navActiveTextClass: 'text-white',
    navHoverClass: 'hover:bg-emerald-900/60 hover:text-white',
    dropdownBgClass: 'bg-emerald-950 text-white',
    dropdownBorderClass: 'border-emerald-850 shadow-2xl',
    dropdownItemHoverClass: 'hover:bg-emerald-900/70',
    profileBtnHoverClass: 'hover:bg-emerald-900/70',
    profileBtnBorderClass: 'border-emerald-800/80',
  },
  grafite: {
    id: 'grafite',
    name: 'Grafite Ônix Executivo',
    subtitle: 'Neutro Puro / Sem tom azul',
    description: 'Preto carbono e grafite puro (zinc/neutral), para quem prefere neutralidade máxima.',
    swatchColors: ['#18181b', '#71717a'],
    headerClass: 'bg-zinc-950 text-zinc-100 shadow-sm',
    headerBorderClass: 'border-zinc-800',
    topStripClass: 'bg-black',
    topStripTextClass: 'text-zinc-400',
    topStripBorderClass: 'border-zinc-900',
    brandTextClass: 'text-white',
    brandSubtextClass: 'text-zinc-400',
    navTextClass: 'text-zinc-300',
    navActiveBgClass: 'bg-zinc-900 text-white border-zinc-700/80 shadow-xs',
    navActiveTextClass: 'text-white',
    navHoverClass: 'hover:bg-zinc-900/60 hover:text-white',
    dropdownBgClass: 'bg-zinc-950 text-zinc-100',
    dropdownBorderClass: 'border-zinc-800 shadow-2xl',
    dropdownItemHoverClass: 'hover:bg-zinc-900/70',
    profileBtnHoverClass: 'hover:bg-zinc-900',
    profileBtnBorderClass: 'border-zinc-800',
  },
};

interface ThemeContextType {
  theme: AppTheme;
  themeConfig: ThemeConfig;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'azul_ipme',
  themeConfig: THEMES.azul_ipme,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('ipme_visual_theme') as AppTheme;
      if (saved && THEMES[saved]) return saved;
    } catch {
      // fallback
    }
    // Default to Azul IPME Oficial!
    return 'azul_ipme';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('ipme_visual_theme', newTheme);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeConfig: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
