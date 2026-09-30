import React, { useState } from 'react';
import { AppUser, UserRole } from '../types/index.ts';
import { formatarDataBR } from '../utils/validation.ts';
import { ShieldCheck, UserPlus, Lock, CheckCircle2, User, Mail, Building, Save, X } from 'lucide-react';

interface UsersViewProps {
  users: AppUser[];
  currentUser: AppUser;
  onRefresh: () => void;
  onSaveUser: (userData: Partial<AppUser>) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  onRefresh,
  onSaveUser,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [department, setDepartment] = useState('IPME - Junta Médica');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setError('Email e Nome são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      await onSaveUser({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        department: department.trim(),
      });
      setModalOpen(false);
      setEmail('');
      setName('');
      setError('');
    } catch (err) {
      setError((err as Error).message || 'Erro ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Gestão de Acessos & Perfis de Usuário (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle de contas administrativas (Google Master) e operadores periciais corporativos (@eusebio.ce.gov.br).
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Conceder Novo Acesso</span>
        </button>
      </div>

      {/* Access Levels Explanatory Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold mb-1">
            <Lock className="w-4 h-4 text-amber-700" />
            <span>Nível Administrador Geral (Admin / Master)</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Acesso irrestrito a todas as operações: Leitura, Escrita, Atualização, Exclusão definitiva de cadastros, exportação de auditoria e gerenciamento de permissões e usuários.
          </p>
        </div>

        <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-4 text-xs">
          <div className="flex items-center gap-2 text-sky-900 font-bold mb-1">
            <User className="w-4 h-4 text-sky-700" />
            <span>Nível Operador Pericial (Operator / RH)</span>
          </div>
          <p className="text-sky-800 leading-relaxed">
            Acesso para cadastramento de servidores, homologação de licenças saúde, concessão de readaptações, prorrogações e conclusão de perícias. Não possui permissão para exclusão definitiva de registros nem gerenciamento de papéis.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nome do Profissional</th>
                <th className="py-3 px-4">Email de Autenticação</th>
                <th className="py-3 px-4">Provedor / Domínio</th>
                <th className="py-3 px-4">Lotação / Departamento</th>
                <th className="py-3 px-4">Perfil de Acesso</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {u.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {u.auth_provider === 'google' ? 'Google Account' : 'Corporativo Eusébio'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {u.department}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      u.role === 'admin' 
                        ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                        : 'bg-sky-100 text-sky-900 border border-sky-300'
                    }`}>
                      {u.role === 'admin' ? 'Administrador' : 'Operador'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        const newRole = u.role === 'admin' ? 'operator' : 'admin';
                        onSaveUser({ email: u.email, name: u.name, role: newRole });
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      Alternar Papel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to add user */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Conceder Acesso ao IPME</span>
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome Completo do Profissional *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Dra. Ana Beatriz Lima"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email de Acesso (Google ou @eusebio.ce.gov.br) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="medico@eusebio.ce.gov.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lotação / Setor
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Ex: IPME - Perícia Médica"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Perfil de Acesso (RBAC) *
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                >
                  <option value="operator">Operador (Leitura, Escrita, Prorrogação, Conclusão)</option>
                  <option value="admin">Administrador (Controle Total, Exclusão e Usuários)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Cadastrar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
