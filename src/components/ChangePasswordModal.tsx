import React, { useState } from 'react';
import { AppUser } from '../types/index.ts';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  onSavePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isFirstAccess?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onSavePassword,
  isFirstAccess = false,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isFirstAccess && !currentPassword.trim()) {
      setError('Por favor, informe a senha atual.');
      return;
    }

    if (!newPassword || newPassword.trim().length < 4) {
      setError('A nova senha deve possuir no mínimo 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não confere com a nova senha digitada.');
      return;
    }

    if (currentPassword && newPassword === currentPassword) {
      setError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setLoading(true);
    try {
      await onSavePassword(currentPassword.trim(), newPassword.trim());
      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess('');
      }, 1200);
    } catch (err) {
      setError((err as Error).message || 'Erro ao alterar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F223D]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#1B3F6E] text-white flex items-center justify-between border-b border-[#2B5485]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm font-bold">
              {isFirstAccess ? 'Definição de Nova Senha Pessoal' : 'Alterar Senha de Acesso'}
            </h2>
          </div>
          {!isFirstAccess && (
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {isFirstAccess && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs text-amber-950">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Primeiro Acesso ao Sistema</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Por motivos de segurança e integridade, substitua a senha provisória definida pelo Administrador por uma nova senha pessoal de sua preferência.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* User info */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Operador Conectado</span>
              <span className="font-semibold text-slate-800">{user.name}</span>
            </div>
            <span className="font-mono text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
              {user.email}
            </span>
          </div>

          {/* Senha Atual */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {isFirstAccess ? 'Senha Provisória Atual (cadastrada pelo Administrador) *' : 'Senha Atual *'}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Informe sua senha atual"
                className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nova Senha Pessoal *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Confirmar Nova Senha Pessoal *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            {!isFirstAccess && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : 'Confirmar Alteração de Senha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
