import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Send, 
  ShieldCheck, 
  Server, 
  Key, 
  Info,
  RefreshCw,
  ExternalLink,
  Cpu
} from 'lucide-react';

interface SmtpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SmtpStatus {
  isConfigured: boolean;
  host?: string;
  port?: number;
  user?: string;
  from?: string;
}

export const SmtpConfigModal: React.FC<SmtpConfigModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<SmtpStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('plinio.catunda@ipmeusebio.ce.gov.br');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/email-status');
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data?.sent) {
        setTestResult({
          success: true,
          message: `E-mail de teste enviado com sucesso para ${testEmail}! ID: ${json.data.messageId || 'OK'}`,
        });
      } else {
        setTestResult({
          success: false,
          message: json.data?.error || json.message || 'Falha ao enviar e-mail de teste via SMTP.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: (err as Error).message || 'Erro ao comunicar com o servidor de e-mail.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1A2F]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 text-xs">
        
        {/* Header */}
        <div className="bg-[#102A4C] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Configuração de Envio de E-mail Real (SMTP)
              </h3>
              <p className="text-[11px] text-blue-200/70">
                Disparo de Códigos de Confirmação & Notificações Corporativas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Strip */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Current Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            status?.isConfigured 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-amber-50 border-amber-300 text-amber-950'
          }`}>
            {status?.isConfigured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  {status?.isConfigured 
                    ? 'Servidor SMTP Ativo & Conectado' 
                    : 'Modo Homologação / Simulação Ativo (Sandbox)'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  status?.isConfigured 
                    ? 'bg-emerald-200 text-emerald-900' 
                    : 'bg-amber-200 text-amber-900'
                }`}>
                  {status?.isConfigured ? 'Disparo Real' : 'Simulação'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {status?.isConfigured ? (
                  <>Os e-mails de confirmação e códigos de ativação estão sendo disparados fisicamente via servidor SMTP para os endereços corporativos dos operadores.</>
                ) : (
                  <>Como o servidor SMTP ainda não foi configurado nas variáveis de ambiente do servidor, o sistema opera em <strong>Modo Sandbox</strong>: o código de ativação de 6 dígitos é gerado com total segurança e exibido na tela para homologação, sem depender de SMTP externo.</>
                )}
              </p>
              {status?.isConfigured && (
                <div className="pt-2 text-[11px] font-mono text-emerald-800">
                  Host: {status.host} | Porta: {status.port} | Remetente: {status.from}
                </div>
              )}
            </div>
          </div>

          {/* Test email sender */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-600" />
                <span>Testar Envio de E-mail</span>
              </span>
              <button
                type="button"
                onClick={fetchStatus}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar Status</span>
              </button>
            </div>

            <form onSubmit={handleSendTest} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="seu.email@ipmeusebio.ce.gov.br"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={testing}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testing ? 'Disparando...' : 'Testar Envio'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 animate-in fade-in ${
                  testResult.success 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : 'bg-red-100 text-red-900 border border-red-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </form>
          </div>

          {/* How to configure SMTP instructions */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Como Configurar o Envio Real para Caixas de Entrada</span>
            </h4>
            
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Para que os e-mails cheguem fisicamente na caixa de entrada corporativa do destinatário (ex.: <strong className="text-slate-800">plinio.catunda@ipmeusebio.ce.gov.br</strong>), adicione as seguintes variáveis no arquivo <strong className="font-mono text-slate-800">.env</strong> ou nas configurações do servidor de hospedagem:
            </p>

            {/* Option A: Prefeitura / IPME Server */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl space-y-1.5 font-mono text-[11px] overflow-x-auto">
              <div className="text-emerald-400 font-bold font-sans text-[11px] mb-1">
                Opção 1: Servidor SMTP do IPME / Prefeitura de Eusébio
              </div>
              <div>SMTP_HOST="smtp.eusebio.ce.gov.br"</div>
              <div>SMTP_PORT=587</div>
              <div>SMTP_USER="notificacoes@ipmeusebio.ce.gov.br"</div>
              <div>SMTP_PASS="sua_senha_do_email"</div>
              <div>SMTP_FROM="\"IPME - Notificações\" &lt;notificacoes@ipmeusebio.ce.gov.br&gt;"</div>
            </div>

            {/* Option B: Google Workspace / Gmail */}
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl space-y-1.5 font-mono text-[11px] overflow-x-auto">
              <div className="text-sky-400 font-bold font-sans text-[11px] mb-1">
                Opção 2: Google Workspace / Gmail Institucional
              </div>
              <div>SMTP_HOST="smtp.gmail.com"</div>
              <div>SMTP_PORT=587</div>
              <div>SMTP_USER="seu-email-institucional@gmail.com"</div>
              <div>SMTP_PASS="xxxx xxxx xxxx xxxx" <span className="text-slate-400 font-sans text-[10px]">(Senha de App Google 16 dígitos)</span></div>
              <div>SMTP_FROM="\"IPME Previdência\" &lt;seu-email-institucional@gmail.com&gt;"</div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Segurança sem Bloqueios:</strong> Enquanto as chaves SMTP não forem configuradas no ambiente, o sistema continua funcionando 100% de ponta a ponta: o Administrador Master pode criar operadores e o código de ativação pode ser consultado e inserido diretamente no modal para ativar qualquer operador!
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Entendido / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
