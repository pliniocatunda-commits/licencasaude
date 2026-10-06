import React, { useState, useMemo } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Search, 
  Building2, 
  Users, 
  Phone, 
  PhoneOff, 
  Calendar, 
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { parseServidoresCSV, ParseCSVResult } from '../utils/csvImporter.ts';
import { api } from '../services/api.ts';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [substituirExistentes, setSubstituirExistentes] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{
    totalLinhas: number;
    servidoresImportados: number;
    servidoresAtualizados: number;
    secretariasImportadas: number;
    secretariasAtualizadas: number;
    telefonesFormatados: number;
    telefonesIgnorados: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parsing reativo do CSV para preview
  const parseResult: ParseCSVResult | null = useMemo(() => {
    if (!csvContent.trim()) return null;
    try {
      return parseServidoresCSV(csvContent);
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [csvContent]);

  // Filtro na tabela de prévia
  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    if (!searchTerm.trim()) return parseResult.rows.slice(0, 15);
    const term = searchTerm.toLowerCase();
    return parseResult.rows
      .filter(r => 
        r.nome.toLowerCase().includes(term) ||
        r.matricula.includes(term) ||
        r.cpf.includes(term) ||
        r.secretaria_completa.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      )
      .slice(0, 25);
  }, [parseResult, searchTerm]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text || '');
    };
    reader.onerror = () => {
      setErrorMessage('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file, 'ISO-8859-1'); // Suporta caracteres acentuados típicos do Brasil
  };

  const handleExecuteImport = async () => {
    if (!csvContent.trim()) {
      setErrorMessage('Por favor, carregue ou cole um arquivo CSV antes de prosseguir.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      const result = await api.importCadastroCSV(csvContent, substituirExistentes);
      setImportResult(result);
      onSuccess();
    } catch (err) {
      console.error('Erro na importação:', err);
      setErrorMessage((err as Error).message || 'Ocorreu um erro durante a importação.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCsvContent('');
    setFileName('');
    setImportResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden text-slate-800">
        
        {/* Cabeçalho */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Importador de Dados Cadastrais (CSV)</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-700/50">
                  Servidores & Secretarias
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Importação oficial para alimentar servidores ativos e cadastro institucional de órgãos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Sucesso após importação */}
          {importResult ? (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-emerald-900">
                  Importação de Dados Concluída com Sucesso!
                </h3>
                <p className="text-xs text-emerald-800 max-w-lg mx-auto">
                  A base cadastral de servidores e órgãos da Prefeitura Municipal de Eusébio foi atualizada conforme os critérios periciais do IPME.
                </p>

                {/* Cards de Métricas do Resultado */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-left">
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Servidores Inseridos</span>
                    <strong className="text-xl font-bold font-mono text-emerald-700">{importResult.servidoresImportados}</strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Servidores Atualizados</span>
                    <strong className="text-xl font-bold font-mono text-slate-700">{importResult.servidoresAtualizados}</strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Secretarias Cadastradas</span>
                    <strong className="text-xl font-bold font-mono text-blue-700">{importResult.secretariasImportadas + importResult.secretariasAtualizadas}</strong>
                  </div>
                  <div className="bg-white p-3.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase block">Telefones Formatados</span>
                    <strong className="text-xl font-bold font-mono text-purple-700">{importResult.telefonesFormatados}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-emerald-100/60 p-2.5 rounded-lg text-center font-medium">
                  {importResult.telefonesIgnorados} números sem 11 dígitos foram ignorados e mantidos vazios para higienização.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Concluir e Acessar Servidores
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Alerta / Mensagem de Erro */}
              {errorMessage && (
                <div className="bg-rose-50 border-l-4 border-rose-600 p-3 rounded-r-lg text-xs text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Área de Seleção de Arquivo e Entrada */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 transition-colors rounded-2xl p-6 bg-slate-50/70 text-center space-y-3">
                <input 
                  type="file" 
                  accept=".csv,.txt"
                  id="csv-file-input"
                  onChange={handleFileUpload}
                  className="hidden" 
                />

                <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center mx-auto text-emerald-600">
                  <FileText className="w-6 h-6" />
                </div>

                <div>
                  <label 
                    htmlFor="csv-file-input"
                    className="font-bold text-emerald-700 hover:text-emerald-800 text-sm cursor-pointer underline"
                  >
                    Clique aqui para selecionar seu arquivo CSV
                  </label>
                  <p className="text-slate-500 text-xs mt-1">
                    Formato oficial: <code>Matrícula; Nome; Telefone; Data Admissão; Cargo; CPF; Cód. Secretaria; Secretaria; E-mail</code>
                  </p>
                </div>

                {fileName && (
                  <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Arquivo carregado: {fileName}</span>
                  </div>
                )}
              </div>

              {/* Opções de Importação & Tratamentos */}
              <div className="bg-slate-100/90 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Regras Oficiais de Tratamento Automático</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-600">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block font-semibold">Tratamento de Telefones:</strong>
                      Números com 11 dígitos ganham máscara de DDD <code>(85) 9XXXX-XXXX</code>. Numerações incompletas (&lt;11 dígitos ou fictícias) são ignoradas.
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800 block font-semibold">Extração de Secretarias:</strong>
                      Código e nome separados com precisão. O CPF é mantido estritamente na coluna de documento do servidor e nunca como secretaria.
                    </div>
                  </div>
                </div>

                {/* Opção de Atualização vs Substituição */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="p-3 rounded-lg border bg-white space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={substituirExistentes}
                        onChange={e => setSubstituirExistentes(e.target.checked)}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className={`font-bold block text-xs ${substituirExistentes ? 'text-rose-700' : 'text-slate-700'}`}>
                          Substituir base completamente (eliminar servidores e histórico anterior de licenças)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                          {substituirExistentes 
                            ? 'Atenção: Todos os servidores e afastamentos/licenças existentes serão excluídos para recomeçar do zero.'
                            : 'Modo seguro ativo: Todas as suas licenças, afastamentos e históricos serão PRESERVADOS! Apenas os cargos, dados cadastrais e secretarias dos servidores serão atualizados/inseridos.'}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Tabela de Prévia / Preview */}
              {parseResult && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                        Prévia dos Dados Identificados
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold">
                        {parseResult.totalRows} servidores detectados
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold">
                        {parseResult.secretarias.length} secretarias
                      </span>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrar por nome, cargo ou matrícula..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Tabela de Prévia com Coluna de Cargo e Secretaria Corrigidas */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse bg-white">
                      <thead className="bg-slate-900 text-white font-semibold sticky top-0 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2 px-2.5">Matrícula</th>
                          <th className="py-2 px-3">Servidor</th>
                          <th className="py-2 px-3">Telefone (Tratado)</th>
                          <th className="py-2 px-3">Admissão</th>
                          <th className="py-2 px-3">Cargo</th>
                          <th className="py-2 px-3">CPF</th>
                          <th className="py-2 px-2">Cód.</th>
                          <th className="py-2 px-3">Secretaria</th>
                          <th className="py-2 px-3">E-mail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRows.map(r => (
                          <tr key={r.matricula} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900">{r.matricula}</td>
                            <td className="py-1.5 px-3 font-semibold text-slate-900 whitespace-nowrap">{r.nome}</td>
                            <td className="py-1.5 px-3 whitespace-nowrap">
                              {r.telefone ? (
                                <span className="text-emerald-700 font-mono font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {r.telefone}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">
                                  {r.telefoneOriginal ? `Ignorado (${r.telefoneOriginal})` : 'Sem telefone'}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-slate-600 whitespace-nowrap">{r.data_admissao || '-'}</td>
                            <td className="py-1.5 px-3 whitespace-nowrap font-medium text-purple-900 max-w-[180px] truncate" title={r.cargo}>
                              <span className="bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                {r.cargo}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 font-mono text-slate-600 whitespace-nowrap">{r.cpf}</td>
                            <td className="py-1.5 px-2 font-mono font-bold text-blue-700 whitespace-nowrap">{r.cod_secretaria}</td>
                            <td className="py-1.5 px-3 text-slate-700 whitespace-nowrap max-w-[180px] truncate" title={r.secretaria_completa}>
                              <span className="font-semibold text-slate-800">{r.sigla_secretaria}</span>
                              <span className="text-slate-400 mx-1">-</span>
                              <span>{r.nome_secretaria}</span>
                            </td>
                            <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap max-w-[140px] truncate">{r.email || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">
                    Exibindo os primeiros registros para validação visual. Todos os {parseResult.totalRows} servidores serão processados.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé de Ações */}
        {!importResult && (
          <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
            {csvContent ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={isProcessing}
                className="text-xs text-rose-700 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar arquivo carregado</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!parseResult || isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processando Importação...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>
                      Confirmar e Importar {parseResult ? `${parseResult.totalRows} Servidores` : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
