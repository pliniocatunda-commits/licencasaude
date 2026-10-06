import React from 'react';
import { useAppTheme, THEMES, AppTheme } from '../context/ThemeContext.tsx';
import { Palette, Check, X, Sparkles, Building2, Sun, Moon, ShieldCheck } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useAppTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Personalização Visual do Sistema
              </h2>
              <p className="text-xs text-slate-400">
                Escolha a paleta de cores que melhor se adapta à sua preferência e ao ambiente de trabalho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Cards de Comparação */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Você pode clicar em qualquer uma das opções abaixo para <strong>aplicar e testar imediatamente</strong> no sistema. O tema escolhido fica salvo no seu navegador.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.keys(THEMES) as AppTheme[]).map((key) => {
              const item = THEMES[key];
              const isSelected = theme === key;

              return (
                <div
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  {/* Top: Swatch & Badges */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      {/* Color Preview Swatch */}
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs" 
                          style={{ backgroundColor: item.swatchColors[0] }}
                          title="Cor principal da barra"
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs" 
                          style={{ backgroundColor: item.swatchColors[1] }}
                          title="Cor de destaque"
                        />
                      </div>

                      {/* Active Indicator */}
                      {isSelected ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Ativo no Sistema
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-medium hover:text-slate-900">
                          Clique para testar
                        </span>
                      )}
                    </div>

                    {/* Name & Subtitle */}
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {item.name}
                      {key === 'azul_ipme' && (
                        <span className="text-[10px] uppercase font-bold bg-blue-100 text-[#1E426D] border border-blue-300 px-1.5 py-0.2 rounded">
                          Oficial IPME
                        </span>
                      )}
                    </h3>
                    <div className="text-xs font-semibold text-slate-600 mt-0.5">
                      {item.subtitle}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Micro Visual Preview Bar */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="text-[10px] text-slate-600 uppercase font-bold tracking-wider mb-1">
                      Amostra do Topo:
                    </div>
                    <div 
                      className="rounded-lg p-2 text-[11px] flex items-center justify-between shadow-2xs border border-slate-300/40"
                      style={{ 
                        backgroundColor: item.swatchColors[0],
                        color: key === 'light' ? '#0f172a' : '#ffffff' 
                      }}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Building2 className="w-3 h-3" />
                        <span>IPME Eusébio</span>
                      </div>
                      <div 
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                        style={{
                          backgroundColor: item.swatchColors[1],
                          color: '#ffffff'
                        }}
                      >
                        Painel
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Configuração salva automaticamente no seu navegador</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
