import React, { createContext, useContext, useState } from 'react';

export type AppTheme = 'azul_ipme' | 'azul_ipme_light' | 'azul_ipme_marinho' | 'azul_ipme_celeste';

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
  pageBgClass: string;
  footerClass: string;
  footerBorderClass: string;
  footerTextClass: string;
  heroBannerClass: string;
  heroBannerBorderClass: string;
  modalHeaderClass: string;
  modalHeaderBorderClass: string;
  accentBadgeClass: string;
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  azul_ipme: {
    id: 'azul_ipme',
    name: 'Azul IPME Clássico Oficial',
    subtitle: 'Cor Oficial da Previdência IPME (Padrão Recomendado)',
    description: 'Tom azul cerúleo / cornflower oficial do IPME (#3868A0 / #85AEE3). Equilíbrio perfeito entre identidade visual municipal, elegância e clareza de leitura.',
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
    dropdownBgClass: 'bg-[#2B5485] text-white',
    dropdownBorderClass: 'border-[#1E426D] shadow-2xl',
    dropdownItemHoverClass: 'hover:bg-[#21436D]',
    profileBtnHoverClass: 'hover:bg-[#2D588B]',
    profileBtnBorderClass: 'border-[#5D8BBE]/60',
    pageBgClass: 'bg-[#F4F7FC]',
    footerClass: 'bg-[#1E426D]',
    footerBorderClass: 'border-[#2B5485]',
    footerTextClass: 'text-blue-200',
    heroBannerClass: 'bg-gradient-to-r from-[#1E426D] via-[#2B5485] to-[#3868A0]',
    heroBannerBorderClass: 'border-[#2B5485]',
    modalHeaderClass: 'bg-[#3868A0]',
    modalHeaderBorderClass: 'border-[#2B5485]',
    accentBadgeClass: 'bg-[#EBF3FC] text-[#1E426D] border-[#BED4EF]',
  },
  azul_ipme_light: {
    id: 'azul_ipme_light',
    name: 'Azul IPME Clean & Arejado',
    subtitle: 'Base Clara e Arejada com Acentos no Azul IPME',
    description: 'Fundo claro com tipografia chumbo e divisores no azul oficial do IPME. Elimina qualquer bloco escuro, proporcionando máxima luminosidade.',
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
    pageBgClass: 'bg-[#F8FAFD]',
    footerClass: 'bg-[#F0F5FC]',
    footerBorderClass: 'border-[#BED4EF]',
    footerTextClass: 'text-slate-600',
    heroBannerClass: 'bg-gradient-to-r from-[#EBF3FC] via-[#F4F8FD] to-white text-slate-800',
    heroBannerBorderClass: 'border-[#BED4EF]',
    modalHeaderClass: 'bg-[#3868A0]',
    modalHeaderBorderClass: 'border-[#2B5485]',
    accentBadgeClass: 'bg-[#EBF3FC] text-[#1E426D] border-[#BED4EF]',
  },
  azul_ipme_marinho: {
    id: 'azul_ipme_marinho',
    name: 'Azul IPME Marinho Nobre',
    subtitle: 'Azul Profundo Institucional (Sem Preto ou Grafite)',
    description: 'Tons de azul marinho nobre (#16325B / #1E426D) característicos de órgãos de previdência. Transmite sobriedade, respeito estatutário e alta autoridade.',
    swatchColors: ['#16325B', '#4880C8'],
    headerClass: 'bg-[#16325B] text-white shadow-sm',
    headerBorderClass: 'border-[#102442]',
    topStripClass: 'bg-[#0F223D]',
    topStripTextClass: 'text-blue-100',
    topStripBorderClass: 'border-[#0B1A2F]',
    brandTextClass: 'text-white',
    brandSubtextClass: 'text-blue-200/90',
    navTextClass: 'text-blue-100/90',
    navActiveBgClass: 'bg-[#0E203B] text-white border-[#3B6EA8]/80 shadow-xs font-semibold',
    navActiveTextClass: 'text-white',
    navHoverClass: 'hover:bg-[#1C3E70] hover:text-white',
    dropdownBgClass: 'bg-[#16325B] text-white',
    dropdownBorderClass: 'border-[#0F223D] shadow-2xl',
    dropdownItemHoverClass: 'hover:bg-[#0E203B]',
    profileBtnHoverClass: 'hover:bg-[#1C3E70]',
    profileBtnBorderClass: 'border-[#3B6EA8]/60',
    pageBgClass: 'bg-[#F0F4FA]',
    footerClass: 'bg-[#0F223D]',
    footerBorderClass: 'border-[#16325B]',
    footerTextClass: 'text-blue-200',
    heroBannerClass: 'bg-gradient-to-r from-[#0F223D] via-[#16325B] to-[#1E426D]',
    heroBannerBorderClass: 'border-[#1E426D]',
    modalHeaderClass: 'bg-[#16325B]',
    modalHeaderBorderClass: 'border-[#0F223D]',
    accentBadgeClass: 'bg-[#E4EEFA] text-[#16325B] border-[#A8C8EE]',
  },
  azul_ipme_celeste: {
    id: 'azul_ipme_celeste',
    name: 'Azul IPME Celeste & Contemporâneo',
    subtitle: 'Azul Vibrante e Iluminado da Marca',
    description: 'Tom azul royal e celeste luminoso (#2B6CB0 / #63B3ED). Visual moderno, fresco e dinâmico, mantendo fidelidade total à identidade do IPME.',
    swatchColors: ['#2B6CB0', '#63B3ED'],
    headerClass: 'bg-[#2B6CB0] text-white shadow-sm',
    headerBorderClass: 'border-[#23588F]',
    topStripClass: 'bg-[#1E4B7A]',
    topStripTextClass: 'text-blue-100',
    topStripBorderClass: 'border-[#183B61]',
    brandTextClass: 'text-white',
    brandSubtextClass: 'text-blue-100',
    navTextClass: 'text-blue-50',
    navActiveBgClass: 'bg-[#1B436D] text-white border-[#63B3ED]/80 shadow-xs font-semibold',
    navActiveTextClass: 'text-white',
    navHoverClass: 'hover:bg-[#255C96] hover:text-white',
    dropdownBgClass: 'bg-[#23588F] text-white',
    dropdownBorderClass: 'border-[#1B436D] shadow-2xl',
    dropdownItemHoverClass: 'hover:bg-[#1B436D]',
    profileBtnHoverClass: 'hover:bg-[#255C96]',
    profileBtnBorderClass: 'border-[#63B3ED]/60',
    pageBgClass: 'bg-[#F4F8FD]',
    footerClass: 'bg-[#1E4B7A]',
    footerBorderClass: 'border-[#23588F]',
    footerTextClass: 'text-blue-100',
    heroBannerClass: 'bg-gradient-to-r from-[#1E4B7A] via-[#2B6CB0] to-[#3B82F6]',
    heroBannerBorderClass: 'border-[#3B82F6]/50',
    modalHeaderClass: 'bg-[#2B6CB0]',
    modalHeaderBorderClass: 'border-[#23588F]',
    accentBadgeClass: 'bg-[#EBF5FE] text-[#1E4B7A] border-[#93C5FD]',
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

