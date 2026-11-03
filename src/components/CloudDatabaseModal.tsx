import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { 
  Cloud, 
  CloudCheck, 
  CloudUpload, 
  CloudDownload, 
  HardDrive, 
  FileDown, 
  FileUp, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  ShieldCheck, 
  Database,
  ArrowRight
} from 'lucide-react';

interface CloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const CloudDatabaseModal: React.FC<CloudDatabaseModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [downloadingCloud, setDownloadingCloud] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [cloudSummary, setCloudSummary] = useState<{
    connected: boolean;
    occurrencesCount: number;
    employeesCount: number;
  }>({ connected: false, occurrencesCount: 0, employeesCount: 0 });

  const [localSummary, setLocalSummary] = useState<{
    employeesCount: number;
    occurrencesCount: number;
    doctorsCount: number;
    secretariasCount: number;
  }>({ employeesCount: 0, occurrencesCount: 0, doctorsCount: 0, secretariasCount: 0 });

  const loadSummaries = async () => {
    try {
      setLoadingSummary(true);
      const local = api.getLocalSummary();
      setLocalSummary(local);
      const cloud = await api.getCloudSummary();
      setCloudSummary(cloud);
    } catch (e) {
      console.warn('Erro ao carregar resumo de nuvem:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setProgressPct(0);
      setProgressText('');
      loadSummaries();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePublishToCloud = async () => {
    try {
      setPublishing(true);
      setStatusMessage(null);
      setProgressPct(5);
      setProgressText('Iniciando comunicação com Google Cloud Firestore...');

      const result = await api.publishToCloud((msg, pct) => {
        setProgressText(msg);
        setProgressPct(pct);
      });

      setStatusMessage({
        type: 'success',
        text: result.message || 'Dados publicados com sucesso na Nuvem Firestore!',
      });
      await loadSummaries();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao enviar dados para a nuvem: ' + (err?.message || 'Falha de comunicação'),
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    if (!window.confirm('Deseja atualizar este navegador com os dados que estão gravados na Nuvem Firestore?')) {
      return;
    }
    try {
      setDownloadingCloud(true);
      setStatusMessage(null);
      const res = await api.downloadFromCloud();
      setStatusMessage({
        type: 'success',
        text: `Dados da nuvem baixados para este navegador: ${res.employees} servidores e ${res.occurrences} licenças carregadas.`,
      });
      await loadSummaries();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao baixar dados da nuvem: ' + (err?.message || 'Falha ao consultar Firestore'),
      });
    } finally {
      setDownloadingCloud(false);
    }
  };

  const handleExportBackup = () => {
    try {
      api.exportBackup();
      setStatusMessage({
        type: 'success',
        text: 'Arquivo de backup JSON gerado e baixado com sucesso para seu computador!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Erro ao gerar backup: ' + (err?.message || ''),
      });
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const res = api.importBackup(parsed);
        setStatusMessage({
          type: 'success',
          text: `Backup restaurado com sucesso! ${res.employees} servidores e ${res.occurrences} licenças disponíveis.`,
        });
        await loadSummaries();
        if (onDataChanged) onDataChanged();
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: 'Falha ao importar backup: ' + (err?.message || 'Arquivo corrompido ou formato inválido'),
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const needsCloudSync = localSummary.occurrencesCount > cloudSummary.occurrencesCount || localSummary.employeesCount > cloudSummary.employeesCount;
  const hasMoreLocalOccurrences = needsCloudSync;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#173252] via-[#1E426D] to-[#255285] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Cloud className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Central de Nuvem & Banco de Dados</h2>
                <span className="text-[10px] bg-sky-400/20 text-sky-200 border border-sky-400/30 px-2 py-0.5 rounded-full font-bold">
                  Google Cloud Firestore
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                Sincronização permanente entre computadores, celulares e navegadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium' 
                : 'bg-red-50 border-red-300 text-red-900 font-medium'
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setStatusMessage(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Comparativo: Nuvem vs. Local */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box Nuvem Firestore */}
            <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-sky-950 uppercase tracking-wide">
                      Na Nuvem (Google Firestore)
                    </span>
                  </div>
                  {cloudSummary.connected ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                      Verificando...
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 py-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Licenças & Ocorrências:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {cloudSummary.occurrencesCount} atos
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Servidores Registrados:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {cloudSummary.employeesCount} servidores
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-sky-200/60 text-[11px] text-sky-800">
                Disponível para qualquer dispositivo com acesso à internet.
              </div>
            </div>

            {/* Box Navegador Local */}
            <div className={`border rounded-xl p-4 flex flex-col justify-between ${
              hasMoreLocalOccurrences 
                ? 'border-amber-300 bg-amber-50/50' 
                : 'border-slate-200 bg-slate-50/50'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className={`w-4 h-4 ${hasMoreLocalOccurrences ? 'text-amber-600' : 'text-slate-600'}`} />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Neste Navegador Local
                    </span>
                  </div>
                  {hasMoreLocalOccurrences && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-bold">
                      Base Mais Atualizada
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 py-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Licenças & Ocorrências:</span>
                    <span className={`font-bold text-sm ${hasMoreLocalOccurrences ? 'text-amber-800 font-extrabold' : 'text-slate-900'}`}>
                      {localSummary.occurrencesCount} atos
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600">Servidores na Memória:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {localSummary.employeesCount} servidores
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                {hasMoreLocalOccurrences ? (
                  <strong className="text-amber-800">Pronto para ser publicado na Nuvem!</strong>
                ) : (
                  'Armazenado com segurança no cache deste navegador.'
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar during upload */}
          {publishing && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-950 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  {progressText}
                </span>
                <span className="font-bold text-sky-700">{progressPct}%</span>
              </div>
              <div className="w-full h-2.5 bg-sky-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-[#1E426D] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Alerta se a base de servidores local estiver incompleta */}
          {localSummary.employeesCount < 1000 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs flex items-center justify-between gap-2">
              <span className="text-amber-900 font-medium">
                Detectado apenas {localSummary.employeesCount} servidor na memória local. Deseja recarregar a lista oficial com todos os 1.527 servidores de Eusébio?
              </span>
              <button
                type="button"
                onClick={async () => {
                  await api.resetEusebioOfficial();
                  await loadSummaries();
                  if (onDataChanged) onDataChanged();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer shadow-xs"
              >
                Restaurar 1.527 Servidores
              </button>
            </div>
          )}

          {/* Principal Ação: Publicar na Nuvem */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border-2 border-emerald-300 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <CloudUpload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-950">
                  Publicar Base Deste Navegador no Cloud Firestore
                </h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Grave todos os <strong>{localSummary.employeesCount} servidores</strong> e as <strong>{localSummary.occurrencesCount} licenças</strong> deste navegador diretamente no Google Cloud Firestore. Após a publicação, o <strong>Mozilla Firefox</strong>, celulares e outros computadores acessarão exatamente esses mesmos dados em tempo real!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handlePublishToCloud}
                disabled={publishing || downloadingCloud}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Publicando na Nuvem...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Publicar Base no Cloud Firestore Agora</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                disabled={publishing}
                className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Gera um arquivo .json seguro com todos os registros em seu computador"
              >
                <FileDown className="w-4 h-4 text-emerald-600" />
                <span>Baixar Backup JSON</span>
              </button>
            </div>
          </div>

          {/* Ferramentas Adicionais de Segurança */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1E426D]" />
              Ferramentas de Contingência e Arquivo
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Importar Backup */}
              <label className="border border-slate-200 hover:border-slate-300 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 cursor-pointer">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportBackup} 
                  className="hidden" 
                  disabled={publishing || downloadingCloud}
                />
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Restaurar / Importar Backup</span>
                  <span className="text-[10px] text-slate-500">Substituir base com um arquivo .json</span>
                </div>
              </label>

              {/* Puxar da Nuvem */}
              <button
                type="button"
                onClick={handleDownloadFromCloud}
                disabled={publishing || downloadingCloud || cloudSummary.occurrencesCount === 0}
                className="border border-slate-200 hover:border-slate-300 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 text-left cursor-pointer disabled:opacity-40"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <CloudDownload className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Puxar Dados da Nuvem</span>
                  <span className="text-[10px] text-slate-500">Atualizar este navegador com o Firestore</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dados 100% seguros com partição independente por município.</span>
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
