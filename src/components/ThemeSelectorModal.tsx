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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F223D]/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-[#BED4EF] max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#3868A0] text-white flex items-center justify-between border-b border-[#2B5485]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-2xs">
              <Palette className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Temas Oficiais IPME Eusébio
                <span className="text-[10px] uppercase font-bold bg-[#254A75] text-blue-100 px-2 py-0.5 rounded border border-[#5281B7]/60">
                  Identidade Visual
                </span>
              </h2>
              <p className="text-xs text-blue-100/90">
                Selecione a variação do azul oficial do IPME mais agradável para o seu uso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Cards de Comparação */}
        <div className="p-6 overflow-y-auto space-y-4 bg-[#F8FAFD]">
          <div className="bg-[#EBF3FC] border border-[#BED4EF] rounded-xl p-3.5 text-xs text-[#1E426D] flex items-start gap-2.5 shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#3868A0] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Todas as opções são harmonizadas com a <strong>paleta institucional azul do IPME</strong>. Clique em qualquer opção para <strong>aplicar e testar imediatamente</strong> em todo o sistema. Sua escolha é memorizada automaticamente.
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
                      ? 'border-[#3868A0] bg-white shadow-md ring-2 ring-[#3868A0]/25'
                      : 'border-[#D4E3F7] hover:border-[#BED4EF] bg-white hover:bg-[#F0F5FC]/50 shadow-2xs'
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
                          title="Tom principal"
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs" 
                          style={{ backgroundColor: item.swatchColors[1] }}
                          title="Tom de acento"
                        />
                      </div>

                      {/* Active Indicator */}
                      {isSelected ? (
                        <span className="text-[11px] font-bold text-[#1E426D] bg-[#EBF3FC] border border-[#BED4EF] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3] text-[#3868A0]" />
                          Ativo no Sistema
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium hover:text-[#1E426D]">
                          Clique para ativar
                        </span>
                      )}
                    </div>

                    {/* Name & Subtitle */}
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {item.name}
                      {key === 'azul_ipme' && (
                        <span className="text-[10px] uppercase font-bold bg-[#EBF3FC] text-[#1E426D] border border-[#BED4EF] px-1.5 py-0.2 rounded">
                          Recomendado
                        </span>
                      )}
                    </h3>
                    <div className="text-xs font-semibold text-[#2B5485] mt-0.5">
                      {item.subtitle}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Micro Visual Preview Bar */}
                  <div className="mt-2 pt-2 border-t border-[#EBF3FC]">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                      Amostra do Topo:
                    </div>
                    <div 
                      className="rounded-lg p-2 text-[11px] flex items-center justify-between shadow-2xs border border-[#BED4EF]/50"
                      style={{ 
                        backgroundColor: item.swatchColors[0],
                        color: key === 'azul_ipme_light' ? '#1E426D' : '#ffffff' 
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
        <div className="px-6 py-3.5 bg-white border-t border-[#BED4EF] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#3868A0]" />
            <span>Configuração salva automaticamente no navegador</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3868A0] hover:bg-[#2B5485] text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
