import React, { useState, useMemo } from 'react';
import { AppUser, UserRole, Secretaria } from '../types/index.ts';
import { formatarDataBR } from '../utils/validation.ts';
import { 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  CheckCircle2, 
  User, 
  Mail, 
  Building, 
  Save, 
  X, 
  Search, 
  UserCheck, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Phone,
  Briefcase,
  ShieldAlert,
  Power,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2
} from 'lucide-react';

interface UsersViewProps {
  users: AppUser[];
  currentUser: AppUser;
  secretarias?: Secretaria[];
  onRefresh: () => void;
  onSaveUser: (userData: Partial<AppUser>) => Promise<void>;
  onDeleteUser?: (email: string) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  currentUser,
  secretarias = [],
  onRefresh,
  onSaveUser,
  onDeleteUser,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [department, setDepartment] = useState('IPME - Junta Médica Pericial');
  const [cargo, setCargo] = useState('Médico Perito Oficial');
  const [telefone, setTelefone] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);

  // Credential Success & Quick Reset Modal states
  const [credentialSuccessData, setCredentialSuccessData] = useState<{
    name: string;
    email: string;
    password: string;
    cargo: string;
    department: string;
    isNew: boolean;
    mustChange: boolean;
  } | null>(null);

  const [resetPasswordUser, setResetPasswordUser] = useState<AppUser | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('123');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetMustChange, setResetMustChange] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedSuccessModal, setCopiedSuccessModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);

  // Open modal for new operator
  const handleOpenNew = () => {
    setEditingUser(null);
    setEmail('');
    setName('');
    setRole('operator');
    setDepartment('IPME - Junta Médica Pericial');
    setCargo('Médico Perito Oficial');
    setTelefone('');
    setAtivo(true);
    setPassword('123');
    setShowPassword(true);
    setMustChangePassword(true);
    setError('');
    setModalOpen(true);
  };

  // Open modal for editing operator
  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setEmail(user.email);
    setName(user.name);
    setRole(user.role);
    setDepartment(user.department || 'IPME - Junta Médica Pericial');
    setCargo(user.cargo || (user.role === 'admin' ? 'Administrador Master' : 'Operador Pericial'));
    setTelefone(user.telefone || '');
    setAtivo(user.ativo !== false);
    setPassword('');
    setShowPassword(false);
    setMustChangePassword(user.must_change_password ?? false);
    setError('');
    setModalOpen(true);
  };

  const handleCopyAccessInfo = (targetUser: { name: string; email: string; password?: string; cargo?: string }) => {
    const portalUrl = window.location.origin;
    const pwdText = targetUser.password || '123';
    const text = `*Portal IPME Eusébio - Credenciais de Acesso do Operador*\n\n` +
      `Olá, ${targetUser.name}!\n` +
      `Seu acesso institucional ao Sistema de Licenças Médicas & Readaptações do IPME foi configurado:\n\n` +
      `🔗 *Link de Acesso:* ${portalUrl}\n` +
      `📧 *E-mail Corporativo:* ${targetUser.email}\n` +
      `🔑 *Senha de Acesso:* ${pwdText}\n\n` +
      `No primeiro login, você poderá alterar esta senha para sua senha pessoal definitiva no menu do perfil.\n` +
      `IPME - Instituto de Previdência do Município de Eusébio`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(targetUser.email);
    setTimeout(() => setCopiedEmail(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !name.trim()) {
      setError('E-mail corporativo e Nome Completo são obrigatórios.');
      return;
    }

    // Validação de formato de e-mail corporativo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!editingUser && (!password || password.trim().length < 3)) {
      setError('Por favor, informe a senha de acesso da conta do operador (mínimo 3 caracteres).');
      return;
    }

    const effectivePassword = password.trim() ? password.trim() : (editingUser?.password || '123');

    setLoading(true);
    try {
      await onSaveUser({
        email: emailNorm,
        name: name.trim(),
        role: emailNorm === 'pliniocatunda@gmail.com' ? 'admin' : role,
        department: department.trim(),
        cargo: cargo.trim(),
        telefone: telefone.trim(),
        ativo,
        password: password.trim() ? password.trim() : undefined,
        must_change_password: mustChangePassword,
        auth_provider: emailNorm === 'pliniocatunda@gmail.com' ? 'google' : 'corporate',
      });

      const wasNew = !editingUser;
      setModalOpen(false);
      setEditingUser(null);
      setError('');

      // Open credentials confirmation modal with explicit access details
      setCredentialSuccessData({
        name: name.trim(),
        email: emailNorm,
        password: effectivePassword,
        cargo: cargo.trim(),
        department: department.trim(),
        isNew: wasNew,
        mustChange: mustChangePassword,
      });
    } catch (err) {
      setError((err as Error).message || 'Erro ao cadastrar operador.');
    } finally {
      setLoading(false);
    }
  };

  // Quick reset password submit
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    if (!resetNewPassword || resetNewPassword.trim().length < 3) {
      setResetError('A nova senha deve possuir no mínimo 3 caracteres.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    try {
      await onSaveUser({
        email: resetPasswordUser.email,
        password: resetNewPassword.trim(),
        must_change_password: resetMustChange,
      });

      setCredentialSuccessData({
        name: resetPasswordUser.name,
        email: resetPasswordUser.email,
        password: resetNewPassword.trim(),
        cargo: resetPasswordUser.cargo || 'Operador Pericial',
        department: resetPasswordUser.department || 'IPME',
        isNew: false,
        mustChange: resetMustChange,
      });

      setResetPasswordUser(null);
    } catch (err) {
      setResetError((err as Error).message || 'Erro ao redefinir senha do operador.');
    } finally {
      setResetLoading(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (user: AppUser) => {
    if (user.email.toLowerCase() === 'pliniocatunda@gmail.com') return;
    try {
      await onSaveUser({
        email: user.email,
        name: user.name,
        ativo: !(user.ativo !== false),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete operator
  const handleConfirmDelete = async () => {
    if (!deleteConfirmEmail || !onDeleteUser) return;
    try {
      await onDeleteUser(deleteConfirmEmail);
      setDeleteConfirmEmail(null);
    } catch (err) {
      setError((err as Error).message || 'Erro ao excluir operador.');
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.department && u.department.toLowerCase().includes(term)) ||
        (u.cargo && u.cargo.toLowerCase().includes(term))
    );
  }, [users, searchTerm]);

  const masterUser = users.find(u => u.email.toLowerCase() === 'pliniocatunda@gmail.com') || {
    id: 'user_master_admin',
    email: 'Pliniocatunda@gmail.com',
    name: 'Plínio Catunda',
    role: 'admin' as UserRole,
    auth_provider: 'google' as const,
    department: 'IPME - Presidência & Governança',
    cargo: 'Administrador Geral & Master do Sistema',
    ativo: true,
    created_at: '2026-01-01',
  };

  const operators = filteredUsers.filter(u => u.email.toLowerCase() !== 'pliniocatunda@gmail.com');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Cadastro & Gestão de Usuários Operadores
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Área administrativa do IPME. O acesso master é restrito ao Administrador Geral (Google: <strong className="text-slate-700">pliniocatunda@gmail.com</strong>), que credencia e gerencia os operadores periciais e de RH com e-mail corporativo do órgão.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Operador</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-white border border-amber-300 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Administrador Master</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-base font-extrabold text-amber-950">Plínio Catunda</div>
            <div className="text-[11px] font-mono text-amber-800 font-semibold mt-0.5">pliniocatunda@gmail.com</div>
          </div>
          <div className="mt-2 text-[10px] text-amber-700">
            Vinculação permanente à conta Google · Superusuário
          </div>
        </div>

        <div className="bg-gradient-to-br from-sky-500/10 via-sky-50 to-white border border-sky-300 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wider">Operadores Cadastrados</span>
            <UserCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-sky-950">
              {users.filter(u => u.email.toLowerCase() !== 'pliniocatunda@gmail.com').length}
            </div>
            <div className="text-[11px] text-sky-800 mt-0.5">E-mails corporativos do órgão</div>
          </div>
          <div className="mt-2 text-[10px] text-sky-700">
            Acesso pericial & gestão de licenças
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-50 to-white border border-emerald-300 rounded-xl p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Operadores Ativos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-950">
              {users.filter(u => u.email.toLowerCase() !== 'pliniocatunda@gmail.com' && u.ativo !== false).length}
            </div>
            <div className="text-[11px] text-emerald-800 mt-0.5">Acessos habilitados</div>
          </div>
          <div className="mt-2 text-[10px] text-emerald-700">
            Habilitados para homologar afastamentos
          </div>
        </div>
      </div>

      {/* MASTER ACCOUNT CARD */}
      <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Conta do Administrador Master do Sistema
              </h2>
              <p className="text-[11px] text-slate-500">
                Superusuário permanente vinculado à conta Google oficial. Não pode ser excluído nem desativado.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            Admin Geral Permanente
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 text-xs">
          <div>
            <span className="text-[10px] text-amber-800 uppercase font-bold block">Nome</span>
            <span className="font-bold text-slate-900">{masterUser.name}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-800 uppercase font-bold block">E-mail Google Vinculado</span>
            <span className="font-mono font-semibold text-slate-900">{masterUser.email}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-800 uppercase font-bold block">Lotação / Atribuição</span>
            <span className="text-slate-800">{masterUser.department || 'IPME - Presidência & Governança'}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-800 uppercase font-bold block">Poderes de Acesso</span>
            <span className="text-emerald-700 font-semibold">Total (RBAC, Auditoria, Exclusões)</span>
          </div>
        </div>
      </div>

      {/* OPERATORS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-600" />
              <span>Operadores Periciais & RH Credenciados ({operators.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Usuários com e-mail corporativo institucional que possuem permissão de entrada no sistema.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar operador..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Table of Operators */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">E-mail Corporativo</th>
                <th className="py-3 px-4">Cargo / Função</th>
                <th className="py-3 px-4">Lotação / Setor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum operador corporativo encontrado com os critérios de busca.
                  </td>
                </tr>
              ) : (
                operators.map(op => {
                  const isAtivo = op.ativo !== false;
                  return (
                    <tr key={op.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{op.name}</div>
                        {op.telefone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{op.telefone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 block max-w-fit">
                          {op.email}
                        </span>
                        {op.must_change_password ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded mt-1 font-medium">
                            <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                            <span>1º Acesso Pendente</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 mt-1 font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Senha Ativa</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {op.cargo || 'Operador Pericial'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {op.department || 'IPME'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(op)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                            isAtivo
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                          }`}
                          title="Clique para alternar status ativo/inativo"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{isAtivo ? 'Ativo' : 'Inativo'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(op)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                            title="Editar Operador"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmEmail(op.email)}
                            className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                            title="Excluir Acesso do Operador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CADASTRO / EDIÇÃO DE OPERADOR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F223D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#BED4EF] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1B3F6E] text-white flex items-center justify-between border-b border-[#2B5485]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-200" />
                <h2 className="text-sm font-bold">
                  {editingUser ? 'Editar Cadastro de Operador' : 'Cadastrar Novo Usuário Operador'}
                </h2>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome Completo do Operador *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Dr. Roberto Bezerra Filho"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              {/* Email Corporativo */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-mail Corporativo Oficial do Órgão *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser && editingUser.email.toLowerCase() === 'pliniocatunda@gmail.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="roberto.bezerra@eusebio.ce.gov.br"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Utilize o e-mail corporativo com domínio institucional oficial (ex: @eusebio.ce.gov.br).
                </span>
              </div>

              {/* Cargo / Função */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cargo / Função Pericial *
                  </label>
                  <input
                    type="text"
                    required
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    placeholder="Ex: Médico Perito Oficial"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefone / Ramal Institucional
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="(85) 3260-1234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Lotação / Setor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lotação / Departamento / Setor *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Ex: IPME - Junta Médica Pericial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              {/* Senha de Acesso */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-800">
                    {editingUser ? 'Redefinir Senha do Operador' : 'Senha de Acesso da Conta *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = 'Ipme@' + Math.floor(1000 + Math.random() * 9000);
                      setPassword(randomPass);
                      setShowPassword(true);
                    }}
                    className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Gerar Senha Automática</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={editingUser ? 'Deixe em branco para manter a senha atual' : 'Digite a senha inicial (ex: Ipme@2026 ou 123)'}
                    className="w-full px-3 py-2 pr-9 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={e => setMustChangePassword(e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                  />
                  <span>Exigir que o operador altere esta senha no primeiro acesso</span>
                </label>

                <p className="text-[10px] text-slate-500 leading-normal">
                  {editingUser
                    ? 'Informe uma nova senha apenas se desejar redefinir a credencial do operador.'
                    : 'Esta é a senha que o operador informará na tela de login para ter acesso ao sistema. O operador poderá alterá-la para uma senha pessoal no menu do perfil.'}
                </p>
              </div>

              {/* Status Ativo */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Status de Acesso</span>
                  <span className="text-[11px] text-slate-500">
                    Se inativo, o operador não conseguirá realizar login no sistema.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={e => setAtivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? 'Salvando...' : editingUser ? 'Atualizar Operador' : 'Confirmar Cadastro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmEmail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F223D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-xs animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Excluir Operador</h3>
              <p className="text-slate-500">
                Tem certeza que deseja remover o acesso corporativo de <strong className="text-slate-800">{deleteConfirmEmail}</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmEmail(null)}
                className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
