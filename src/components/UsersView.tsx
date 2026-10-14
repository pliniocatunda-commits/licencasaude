import React, { useState, useMemo } from 'react';
import { AppUser, UserRole, Secretaria } from '../types/index.ts';
import { formatarDataBR } from '../utils/validation.ts';
import { EmailConfirmationModal } from './EmailConfirmationModal.tsx';
import { SmtpConfigModal } from './SmtpConfigModal.tsx';
import { api } from '../services/api.ts';
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
  Sparkles,
  Send,
  Clock,
  Server
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

  // Password & Security form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);

  // Email Confirmation Modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [previewUser, setPreviewUser] = useState<AppUser | null>(null);
  const [smtpModalOpen, setSmtpModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);

  // Helper to generate a random strong password
  const handleGeneratePassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newPwd = `Ipme@${randomDigits}#`;
    setPassword(newPwd);
    setConfirmPassword(newPwd);
  };

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
    const initialPass = `Ipme@${Math.floor(1000 + Math.random() * 9000)}`;
    setPassword(initialPass);
    setConfirmPassword(initialPass);
    setShowPassword(false);
    setMustChangePassword(false);
    setSendConfirmationEmail(false);
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
    setConfirmPassword('');
    setShowPassword(false);
    setMustChangePassword(user.must_change_password ?? false);
    setSendConfirmationEmail(false);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !name.trim()) {
      setError('E-mail corporativo e Nome Completo são obrigatórios.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!editingUser) {
      if (!password || password.trim().length < 6) {
        setError('A senha inicial do usuário deve possuir no mínimo 6 caracteres.');
        return;
      }
      if (confirmPassword && confirmPassword.trim() !== password.trim()) {
        setError('A confirmação da senha não coincide com a senha digitada.');
        return;
      }
    } else if (password && password.trim()) {
      if (password.trim().length < 6) {
        setError('A nova senha deve possuir no mínimo 6 caracteres.');
        return;
      }
      if (confirmPassword && confirmPassword.trim() !== password.trim()) {
        setError('A confirmação da senha não coincide com a nova senha digitada.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Partial<AppUser> = {
        email: emailNorm,
        name: name.trim(),
        role: emailNorm === 'pliniocatunda@gmail.com' ? 'admin' : role,
        department: department.trim(),
        cargo: cargo.trim(),
        telefone: telefone.trim(),
        ativo,
        auth_provider: emailNorm === 'pliniocatunda@gmail.com' ? 'google' : 'corporate',
        must_change_password: mustChangePassword,
        email_verified: true,
      };

      if (password && password.trim()) {
        payload.password = password.trim();
      }

      await onSaveUser(payload);
      setModalOpen(false);
      setEditingUser(null);
      setError('');
      setSuccessBanner(
        editingUser
          ? `Operador "${name.trim()}" atualizado com sucesso!`
          : `Operador "${name.trim()}" cadastrado com sucesso! Acesso corporativo liberado com a senha definida.`
      );
    } catch (err) {
      setError((err as Error).message || 'Erro ao cadastrar operador.');
    } finally {
      setLoading(false);
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

  // Handle immediate confirmation from email preview modal
  const handleConfirmEmailNow = async (userEmail: string, code: string) => {
    await api.confirmEmail(userEmail, code);
    onRefresh();
  };

  // Resend confirmation email
  const handleResendConfirmation = async (user: AppUser) => {
    try {
      const res = await api.resendConfirmationEmail(user.email);
      setPreviewUser({
        ...user,
        confirmation_code: res.code,
        confirmation_token: res.token,
      });
      setEmailModalOpen(true);
      onRefresh();
    } catch (err) {
      alert((err as Error).message || 'Erro ao reenviar e-mail.');
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
    email_verified: true,
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
            Área administrativa do IPME. O acesso master é restrito ao Administrador Geral (Google: <strong className="text-slate-700">pliniocatunda@gmail.com</strong>), que credencia e gerencia os operadores periciais e de RH com e-mail corporativo do órgão, senhas e autenticação por e-mail.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setSmtpModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            title="Configurações de Envio de E-mail Real (SMTP)"
          >
            <Server className="w-4 h-4 text-sky-600" />
            <span>Configuração de E-mail (SMTP)</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Novo Operador</span>
          </button>
        </div>
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
                Superusuário permanente com permissão irrestrita de gestão, cadastro de operadores e auditoria.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Permanente & Inviolável
          </span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white border-2 border-amber-400 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              <img
                src={masterUser.avatar_url || '/src/assets/images/ipme_seal_logo_1790337165041.jpg'}
                alt="Brasão IPME"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">{masterUser.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-800 border border-amber-400/40">
                  ADMIN MASTER
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  E-mail Confirmado
                </span>
              </div>
              <div className="text-xs font-mono text-slate-600 mt-0.5">
                {masterUser.email}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {masterUser.department} · {masterUser.cargo || 'Administrador Geral'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Acesso 100% Protegido contra exclusão</span>
          </div>
        </div>
      </div>

      {/* OPERATORS MANAGEMENT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Operadores Periciais & Analistas Credenciados
            </h3>
            <p className="text-[11px] text-slate-500">
              Gerencie senhas, status de ativação por e-mail e permissões periciais.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar operador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
          </div>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setSuccessBanner(null)} 
              className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md hover:bg-emerald-100/60 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Operador / Servidor</th>
                <th className="py-3 px-4">E-mail Corporativo</th>
                <th className="py-3 px-4">Cargo / Função</th>
                <th className="py-3 px-4">Lotação / Setor</th>
                <th className="py-3 px-4 text-center">Acesso & Senha</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum operador corporativo cadastrado ou encontrado na busca.
                  </td>
                </tr>
              ) : (
                operators.map(op => {
                  const isAtivo = op.ativo !== false;

                  return (
                    <tr key={op.id || op.email} className="hover:bg-slate-50/70 transition-colors">
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
                        <span className="font-mono font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {op.email}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {op.cargo || 'Operador Pericial'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {op.department || 'IPME'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Liberado com Senha</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(op)}
                            className="p-1.5 text-slate-600 hover:text-sky-700 rounded hover:bg-slate-100 cursor-pointer flex items-center gap-1 text-[11px]"
                            title="Editar Dados / Alterar Senha"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar / Senha</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmEmail(op.email)}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
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
                  {editingUser ? 'Editar Cadastro & Senha de Operador' : 'Cadastrar Novo Usuário Operador'}
                </h2>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[82vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
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

              {/* SENHA DO USUÁRIO & CREDENCIAIS DE ACESSO */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    <span>{editingUser ? 'Definir / Redefinir Senha de Acesso' : 'Senha Inicial de Acesso *'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Gerar Senha Segura</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {editingUser ? 'Nova Senha (vazio para manter)' : 'Senha do Usuário *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingUser}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Ex: Ipme@2026"
                        className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirmar Senha {editingUser && '(opcional)'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingUser && !!password}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mustChangePassword}
                      onChange={e => setMustChangePassword(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Exigir que o operador altere esta senha no primeiro login (opcional)</span>
                  </label>

                  <div className="p-2 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-[11px] text-emerald-900 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Acesso imediato ativo: o operador poderá acessar o sistema diretamente com este e-mail corporativo e a senha definida acima.</span>
                  </div>
                </div>
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
                  <span>{loading ? 'Salvando...' : editingUser ? 'Atualizar Operador' : 'Confirmar & Criar Acesso'}</span>
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

      {/* EMAIL CONFIRMATION MODAL PREVIEW */}
      <EmailConfirmationModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        user={previewUser}
        onConfirmNow={handleConfirmEmailNow}
      />

      {/* SMTP CONFIGURATION & TEST MODAL */}
      <SmtpConfigModal
        isOpen={smtpModalOpen}
        onClose={() => setSmtpModalOpen(false)}
      />
    </div>
  );
};
