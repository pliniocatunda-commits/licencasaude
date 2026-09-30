import React, { useState, useEffect } from 'react';
import { Doctor, DoctorVinculo } from '../types/index.ts';
import { X, Stethoscope, Award, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: Partial<Doctor>) => Promise<void>;
  initialDoctor?: Doctor | null;
}

export const DoctorModal: React.FC<DoctorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDoctor,
}) => {
  const [nome, setNome] = useState('');
  const [crm, setCrm] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [vinculo, setVinculo] = useState<DoctorVinculo>('Efetivo');
  const [isDiretor, setIsDiretor] = useState(false);
  const [ativo, setAtivo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDoctor) {
      setNome(initialDoctor.nome || '');
      setCrm(initialDoctor.crm || '');
      setEspecialidade(initialDoctor.especialidade || '');
      setVinculo(initialDoctor.vinculo || 'Efetivo');
      setIsDiretor(Boolean(initialDoctor.is_diretor));
      setAtivo(initialDoctor.ativo !== undefined ? initialDoctor.ativo : true);
    } else {
      setNome('');
      setCrm('');
      setEspecialidade('Medicina do Trabalho / Perícia Médica Oficial');
      setVinculo('Efetivo');
      setIsDiretor(false);
      setAtivo(true);
    }
    setError(null);
  }, [initialDoctor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNome = nome.trim();
    let cleanCrm = crm.trim().toUpperCase();

    if (!cleanNome) {
      setError('O Nome Completo do Médico é obrigatório.');
      return;
    }

    if (!cleanCrm) {
      setError('O Número do Registro CRM é obrigatório.');
      return;
    }

    // Auto-prefix CRM/CE if user just entered numbers or CRM without UF
    if (!cleanCrm.startsWith('CRM')) {
      cleanCrm = `CRM/CE ${cleanCrm}`;
    }

    try {
      setLoading(true);
      await onSave({
        id: initialDoctor?.id,
        nome: cleanNome,
        crm: cleanCrm,
        especialidade: especialidade.trim() || undefined,
        vinculo,
        is_diretor: isDiretor,
        ativo,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Falha ao salvar médico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  {initialDoctor ? 'Editar Médico Perito' : 'Cadastrar Médico Perito'}
                </h2>
                {initialDoctor?.id && (
                  <span className="text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded">
                    ID #{initialDoctor.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Cadastro pericial oficial do IPME
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome Completo do Médico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Dr. Marcelo Cavalcante Holanda"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CRM */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registro CRM <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={crm}
                  onChange={e => setCrm(e.target.value)}
                  placeholder="Ex: CRM/CE 14.892"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
                />
                <Award className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Especialidade (Opcional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Especialidade <span className="text-slate-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                placeholder="Ex: Medicina do Trabalho"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Vínculo Funcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Vínculo Funcional <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Efetivo', 'Comissionado', 'Temporário'] as DoctorVinculo[]).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVinculo(v)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                    vinculo === v
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500/50 shadow-2xs font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {vinculo === 'Efetivo' && 'Servidor público estatutário/efetivo do Município de Eusébio.'}
              {vinculo === 'Comissionado' && 'Profissional ocupante de cargo em comissão.'}
              {vinculo === 'Temporário' && 'Profissional sob contrato por tempo determinado / credenciamento.'}
            </p>
          </div>

          {/* Definição de Médico Diretor */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            isDiretor 
              ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300/60' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isDiretor ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      Médico Diretor da Junta Pericial
                    </span>
                    {isDiretor && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-200 text-amber-900">
                        Assinatura Oficial
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Define este profissional como o Diretor Médico responsável técnico. Sua assinatura oficial constará no <strong>Relatório Executivo Oficial</strong> e nos atos periciais do IPME.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={isDiretor}
                  onChange={e => setIsDiretor(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Status Ativo */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                Cadastro Ativo
              </span>
              <span className="text-[11px] text-slate-500 block">
                Permite vincular este médico aos laudos periciais e prorrogações
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={e => setAtivo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : initialDoctor ? 'Atualizar Médico' : 'Salvar Médico'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
