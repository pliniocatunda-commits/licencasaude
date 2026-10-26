import React, { useState, useEffect } from 'react';
import { TenantInfo } from '../types/index.ts';
import { api } from '../services/api.ts';
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Server, 
  Building2, 
  X, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';

interface TenantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantChanged: (tenantId: string) => void;
}

export const TenantSelectorModal: React.FC<TenantSelectorModalProps> = ({
  isOpen,
  onClose,
  onTenantChanged,
}) => {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string>(api.getActiveTenantId());
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [syncingOfficial, setSyncingOfficial] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form for new tenant
  const [newNome, setNewNome] = useState('');
  const [newSigla, setNewSigla] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newCidade, setNewCidade] = useState('');
  const [newUf, setNewUf] = useState('CE');
  const [newAmbiente, setNewAmbiente] = useState<'producao' | 'homologacao'>('producao');
  const [newDescricao, setNewDescricao] = useState('');

  const loadTenants = async () => {
    try {
      setLoading(true);
      const list = await api.getTenants();
      setTenants(list);
      setActiveTenantId(api.getActiveTenantId());
    } catch (err) {
      console.error('Erro ao carregar lista de tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTenants();
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTenant = (tenantId: string) => {
    api.setActiveTenantId(tenantId);
    setActiveTenantId(tenantId);
    onTenantChanged(tenantId);
    onClose();
  };

  const handleForceSyncEusebio = async () => {
    try {
      setSyncingOfficial(true);
      setStatusMsg(null);
      await api.resetEusebioOfficial();
      if (activeTenantId === 'ipme_eusebio') {
        onTenantChanged('ipme_eusebio');
      }
      setStatusMsg({
        type: 'success',
        text: 'Base Oficial de Eusébio sincronizada com sucesso! Todos os 1.527 servidores ativos.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: 'Erro ao sincronizar base de Eusébio: ' + (err as Error).message,
      });
    } finally {
      setSyncingOfficial(false);
    }
  };

  const handleResetSandbox = async () => {
    try {
      setResetting(true);
      setStatusMsg(null);
      await api.resetSandbox();
      if (activeTenantId === 'studio_sandbox') {
        onTenantChanged('studio_sandbox');
      }
      setStatusMsg({
        type: 'success',
        text: 'Sandbox de Testes restaurado com dados simulados de teste padrão.',
      });
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: 'Erro ao redefinir sandbox: ' + (err as Error).message,
      });
    } finally {
      setResetting(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim() || !newSigla.trim()) {
      setStatusMsg({ type: 'error', text: 'Nome e Sigla são obrigatórios.' });
      return;
    }

    try {
      setLoading(true);
      setStatusMsg(null);
      const created = await api.saveTenant({
        nome: newNome.trim(),
        sigla: newSigla.trim().toUpperCase(),
        cnpj: newCnpj.trim() || '00.000.000/0001-00',
        cidade: newCidade.trim() || 'Município',
        uf: newUf.trim().toUpperCase() || 'CE',
        ambiente: newAmbiente,
        ativo: true,
        descricao: newDescricao.trim() || `Instância isolada para ${newNome}`,
      });

      setShowAddForm(false);
      setNewNome('');
      setNewSigla('');
      setNewCnpj('');
      setNewCidade('');
      setNewDescricao('');
      await loadTenants();
      handleSelectTenant(created.id);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Erro ao criar novo cliente/ambiente: ' + (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#173252] to-[#1E426D] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Gestão de Ambientes & Clientes</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full font-bold">
                  Isolamento Total
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                Segregação estrita de dados: Produção do cliente vs. Homologação/Testes Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {statusMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
              statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{statusMsg.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setStatusMsg(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Status Box */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sky-950">Garantia de Segurança & Não Contaminação</p>
              <p className="text-sky-800 leading-relaxed">
                Cada cliente ou ambiente opera em uma <strong>partição física independente</strong> tanto nos arquivos de dados quanto nas coleções do Cloud Firestore (<code className="bg-sky-100 px-1 py-0.5 rounded text-[11px] font-mono">/tenants/{'{tenantId}'}/...</code>). 
                Testes, inclusões ou exclusões realizados no Studio <strong>NUNCA afetam os dados de produção do cliente</strong>.
              </p>
            </div>
          </div>

          {/* Tenants List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Selecione o Banco / Ambiente Ativo:
              </h3>
              <span className="text-[11px] text-slate-500">
                {tenants.length} ambiente(s) registrado(s)
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#1E426D]" />
                Carregando partições de banco de dados...
              </div>
            ) : (
              <div className="space-y-2.5">
                {tenants.map(tenant => {
                  const isActive = tenant.id === activeTenantId;
                  const isProd = tenant.ambiente === 'producao';

                  return (
                    <div
                      key={tenant.id}
                      className={`relative border-2 rounded-xl p-4 transition-all ${
                        isActive
                          ? isProd 
                            ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                            : 'border-amber-500 bg-amber-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isProd 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300' 
                              : 'bg-amber-100 text-amber-700 border-amber-300'
                          }`}>
                            {isProd ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {tenant.nome}
                              </span>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                isProd
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {isProd ? '🟢 Produção Oficial' : '🟡 Testes & Homologação'}
                              </span>
                              {isActive && (
                                <span className="text-[10px] bg-[#1E426D] text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  Ativo Agora
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 mt-1">
                              {tenant.descricao}
                            </p>

                            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                              <span><strong>Identificador:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{tenant.id}</code></span>
                              <span>·</span>
                              <span><strong>CNPJ:</strong> {tenant.cnpj}</span>
                              <span>·</span>
                              <span><strong>Localidade:</strong> {tenant.cidade}/{tenant.uf}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => handleSelectTenant(tenant.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                                isProd
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white'
                              }`}
                            >
                              Alternar para este
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Conectado
                            </span>
                          )}

                          {tenant.id === 'ipme_eusebio' && (
                            <button
                              type="button"
                              onClick={handleForceSyncEusebio}
                              disabled={syncingOfficial}
                              title="Garante a sincronização de todos os 1.527 servidores oficiais de Eusébio"
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 border border-emerald-300 hover:bg-emerald-50 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className={`w-3 h-3 ${syncingOfficial ? 'animate-spin text-emerald-600' : ''}`} />
                              <span>Sincronizar 1.527 Servidores</span>
                            </button>
                          )}

                          {tenant.id === 'studio_sandbox' && (
                            <button
                              type="button"
                              onClick={handleResetSandbox}
                              disabled={resetting}
                              title="Restaurar dados de teste padrão do Sandbox"
                              className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin text-amber-600' : ''}`} />
                              <span>Resetar Testes</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Tenant Accordion/Button */}
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:border-[#1E426D] hover:text-[#1E426D] hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Novo Cliente / Autarquia Municipal (Multi-Tenant)</span>
            </button>
          ) : (
            <form onSubmit={handleCreateTenant} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#1E426D]" />
                  Cadastrar Novo Cliente / Autarquia Municipal
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome da Autarquia / Instituto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: IPM Aquiraz - Instituto de Previdência..."
                    value={newNome}
                    onChange={e => setNewNome(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E426D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sigla / Identificador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: IPM_AQUIRAZ"
                    value={newSigla}
                    onChange={e => setNewSigla(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E426D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    CNPJ Oficial
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={newCnpj}
                    onChange={e => setNewCnpj(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E426D]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cidade / UF
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Município"
                      value={newCidade}
                      onChange={e => setNewCidade(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E426D]"
                    />
                    <input
                      type="text"
                      maxLength={2}
                      placeholder="UF"
                      value={newUf}
                      onChange={e => setNewUf(e.target.value.toUpperCase())}
                      className="w-14 px-2 py-1.5 text-xs border border-slate-300 rounded-lg text-center uppercase font-bold focus:ring-2 focus:ring-[#1E426D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tipo de Ambiente
                  </label>
                  <select
                    value={newAmbiente}
                    onChange={e => setNewAmbiente(e.target.value as 'producao' | 'homologacao')}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E426D] bg-white"
                  >
                    <option value="producao">🟢 Produção Oficial</option>
                    <option value="homologacao">🟡 Testes / Homologação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Observações / Descrição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Base definitiva oficial de perícias..."
                    value={newDescricao}
                    onChange={e => setNewDescricao(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1E426D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#1E426D] hover:bg-[#173252] rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Salvar e Criar Partição
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dados isolados por Tenant ID na API e Firestore.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
