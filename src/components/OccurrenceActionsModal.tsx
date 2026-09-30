import React, { useState, useEffect, useMemo } from 'react';
import { Occurrence, Doctor } from '../types/index.ts';
import { formatarDataBR, calcularQuantidadeDias, calcularDiasPagos } from '../utils/validation.ts';
import { X, Clock, CheckCircle2, AlertTriangle, Calendar, Save, History, FileBadge, Award, ShieldCheck, AlertCircle } from 'lucide-react';

interface ProrrogarModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
  onConfirm: (data: { novaDataTermino: string; motivo: string; medico?: string; crm?: string }) => Promise<void>;
}

export const ProrrogarModal: React.FC<ProrrogarModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  onConfirm,
}) => {
  const [novaDataTermino, setNovaDataTermino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [medico, setMedico] = useState('');
  const [crm, setCrm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (occurrence) {
      // Suggest 30 days after current data_termino
      const cur = new Date(occurrence.data_termino + 'T00:00:00');
      const sug = new Date(cur.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setNovaDataTermino(sug);
      setMotivo('Necessidade de continuidade do tratamento médico prescrito com reavaliação clínica.');
      setMedico(occurrence.medico_perito);
      setCrm(occurrence.crm);
      setError('');
    }
  }, [occurrence, isOpen]);

  if (!isOpen || !occurrence) return null;

  const totalDays = calcularQuantidadeDias(occurrence.data_inicio, novaDataTermino);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaDataTermino || novaDataTermino <= occurrence.data_termino) {
      setError('A nova data de término deve ser posterior à data atual de término (' + formatarDataBR(occurrence.data_termino) + ').');
      return;
    }
    setLoading(true);
    try {
      await onConfirm({ novaDataTermino, motivo, medico, crm });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Erro ao prorrogar afastamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-amber-900 text-white flex items-center justify-between border-b border-amber-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm font-bold">
              Prorrogar Afastamento · {occurrence.id}
            </h2>
          </div>
          <button onClick={onClose} className="text-amber-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-950 text-xs">
                {occurrence.employee_nome} ({occurrence.matricula})
              </span>
              <span className="font-mono text-[10px] font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                {(occurrence.prorrogacoes?.length || 0) + 1}ª Prorrogação
              </span>
            </div>
            <div className="text-amber-800 text-[11px] flex flex-wrap items-center gap-2">
              <span>Término atual vigente: <strong className="font-mono">{formatarDataBR(occurrence.data_termino)}</strong></span>
              <span>·</span>
              <span>{occurrence.quantidade_dias} dias acumulados</span>
            </div>
            {occurrence.prorrogacoes && occurrence.prorrogacoes.length > 0 && (
              <div className="text-[10px] text-amber-700 bg-amber-100/60 p-1.5 rounded flex items-center gap-1">
                <History className="w-3 h-3 text-amber-800 shrink-0" />
                <span>Já possui {occurrence.prorrogacoes.length} prorrogação(ões) anterior(es) registrada(s).</span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Nova Data de Término / Retorno Previsto *
            </label>
            <input
              type="date"
              required
              value={novaDataTermino}
              onChange={e => setNovaDataTermino(e.target.value)}
              className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {novaDataTermino && novaDataTermino > occurrence.data_termino && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 grid grid-cols-2 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">
                    Dias Adicionados
                  </span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    +{Math.round((new Date(novaDataTermino + 'T12:00:00').getTime() - new Date(occurrence.data_termino + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))} dias
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">
                    Novo Total Acumulado
                  </span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    {totalDays}d ({calcularDiasPagos(totalDays)}d pagos IPME)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Médico Perito Homologador
            </label>
            <input
              type="text"
              value={medico}
              onChange={e => setMedico(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Justificativa Pericial da Prorrogação *
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Descreva o motivo clínico da extensão do prazo..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Homologar Prorrogação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConcluirModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
  onConfirm: (parecerFinal: string) => Promise<void>;
}

export const ConcluirModal: React.FC<ConcluirModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  onConfirm,
}) => {
  const [parecerFinal, setParecerFinal] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (occurrence) {
      setParecerFinal('Perícia de retorno realizada pela Junta Médica Oficial do IPME. Servidor avaliado clinicamente e considerado apto para retorno às atividades funcionais regulares.');
      setError('');
    }
  }, [occurrence, isOpen]);

  if (!isOpen || !occurrence) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(parecerFinal);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Erro ao concluir afastamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold">
              Concluir Perícia e Encerrar Afastamento
            </h2>
          </div>
          <button onClick={onClose} className="text-emerald-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
            <div className="font-semibold text-emerald-900">
              {occurrence.employee_nome} · Matrícula {occurrence.matricula}
            </div>
            <div className="text-emerald-800 text-[11px]">
              Ocorrência {occurrence.id} ({occurrence.tipo}) · {occurrence.quantidade_dias} dias totais.
            </div>
            <div className="text-[11px] text-emerald-700 font-medium pt-1">
              Ao concluir esta perícia, o status funcional do servidor será <strong>restaurado automaticamente para "Ativo"</strong> na folha do município.
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Parecer Conclusivo da Junta Médica Pericial *
            </label>
            <textarea
              rows={4}
              required
              value={parecerFinal}
              onChange={e => setParecerFinal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar Conclusão e Retorno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CancelarModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
  onConfirm: (motivo: string) => Promise<void>;
}

export const CancelarModal: React.FC<CancelarModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  onConfirm,
}) => {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !occurrence) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Por favor informe a justificativa do cancelamento.');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(motivo);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Erro ao cancelar ocorrência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold">
              Cancelar Registro de Afastamento
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <p className="text-slate-600">
            Você está prestes a cancelar o registro <strong>{occurrence.id}</strong> do servidor <strong>{occurrence.employee_nome}</strong>. O histórico do cancelamento ficará registrado na trilha de auditoria para fins de compliance.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Justificativa do Cancelamento *
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: Cancelamento a pedido da chefia por duplicidade de atestado..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface ConverterDefinitivaModalProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: Occurrence | null;
  doctors?: Doctor[];
  onConfirm: (data: {
    dataConcessao: string;
    atoConcessao?: string;
    motivo?: string;
    medico?: string;
    crm?: string;
    parecerTecnico?: string;
  }) => Promise<void>;
}

export const ConverterDefinitivaModal: React.FC<ConverterDefinitivaModalProps> = ({
  isOpen,
  onClose,
  occurrence,
  doctors = [],
  onConfirm,
}) => {
  const [dataConcessao, setDataConcessao] = useState('');
  const [atoConcessao, setAtoConcessao] = useState('');
  const [motivo, setMotivo] = useState('');
  const [medico, setMedico] = useState('');
  const [crm, setCrm] = useState('');
  const [parecerTecnico, setParecerTecnico] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minDate = useMemo(() => {
    if (!occurrence?.data_termino) return '';
    const dt = new Date(occurrence.data_termino + 'T00:00:00');
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString().split('T')[0];
  }, [occurrence]);

  useEffect(() => {
    if (occurrence) {
      const dt = new Date(occurrence.data_termino + 'T00:00:00');
      dt.setDate(dt.getDate() + 1);
      const diaAposTermino = dt.toISOString().split('T')[0];
      const hoje = new Date().toISOString().split('T')[0];

      // Regra: A concessão só pode ocorrer após o prazo vigente (término)
      const dataSugerida = hoje > occurrence.data_termino ? hoje : diaAposTermino;
      setDataConcessao(dataSugerida);
      setAtoConcessao('');
      setMotivo('Incapacidade laborativa definitiva e permanente homologada em laudo oficial da Junta Médica do IPME.');
      
      const diretor = doctors.find(d => d.is_diretor && d.ativo);
      if (diretor) {
        setMedico(diretor.nome);
        setCrm(diretor.crm);
      } else {
        setMedico(occurrence.medico_perito || '');
        setCrm(occurrence.crm || '');
      }
      setParecerTecnico('Junta Médica Oficial do IPME realizou perícia médica conclusiva e atestou incapacidade total e permanente para as atribuições do cargo, sem viabilidade de readaptação funcional.');
      setError('');
    }
  }, [occurrence, doctors, isOpen]);

  if (!isOpen || !occurrence) return null;

  const handleDoctorSelect = (selectedNome: string) => {
    setMedico(selectedNome);
    const doc = doctors.find(d => d.nome === selectedNome);
    if (doc) {
      setCrm(doc.crm);
    }
  };

  const isDataWithinTermino = dataConcessao && occurrence.data_termino && dataConcessao <= occurrence.data_termino;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataConcessao) {
      setError('A Data da Concessão é obrigatória para tornar a licença permanente.');
      return;
    }
    if (occurrence.data_termino && dataConcessao <= occurrence.data_termino) {
      setError(`A licença permanente não poderá ser concedida dentro do prazo vigente de licença (término em ${formatarDataBR(occurrence.data_termino)}). A Data da Concessão deve ser posterior a essa data (a partir de ${formatarDataBR(minDate)}).`);
      return;
    }
    setLoading(true);
    try {
      await onConfirm({
        dataConcessao,
        atoConcessao: atoConcessao.trim() || undefined,
        motivo: motivo.trim() || undefined,
        medico: medico.trim() || undefined,
        crm: crm.trim() || undefined,
        parecerTecnico: parecerTecnico.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Erro ao converter ocorrência em definitiva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-purple-950 text-white flex items-center justify-between border-b border-purple-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-800/80 border border-purple-600/50 flex items-center justify-center text-purple-200">
              <FileBadge className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Converter em Licença Permanente / Definitiva
                </h2>
                <span className="text-[11px] font-mono font-bold bg-purple-900 text-purple-300 border border-purple-700 px-2 py-0.5 rounded">
                  Nº {occurrence.id}
                </span>
              </div>
              <p className="text-xs text-purple-300">
                Homologação de Incapacidade Permanente · IPME
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-purple-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Resumo da Licença de Origem */}
          <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 text-xs">
                {occurrence.employee_nome} ({occurrence.matricula})
              </span>
              <span className="text-[10px] font-semibold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded">
                Origem: {occurrence.tipo}
              </span>
            </div>
            <div className="text-purple-900 text-[11px] flex flex-wrap items-center gap-2">
              <span>{occurrence.employee_cargo} · {occurrence.employee_secretaria?.split(' - ')[0]}</span>
              <span>·</span>
              <span>Início: <strong>{formatarDataBR(occurrence.data_inicio)}</strong></span>
              <span>·</span>
              <span>Término Vigente: <strong>{formatarDataBR(occurrence.data_termino)}</strong></span>
              <span>·</span>
              <span>{occurrence.quantidade_dias} dias</span>
            </div>
          </div>

          {/* Card com a Regra Oficial */}
          <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl text-[11px] text-amber-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Regra Legal de Concessão de Licença Permanente</span>
            </div>
            <p className="text-amber-900 leading-relaxed">
              A licença permanente <strong>não poderá ser concedida dentro do prazo vigente de licença</strong> (vigente até <strong>{formatarDataBR(occurrence.data_termino)}</strong>). Ela só poderá ser concedida <strong>após essa data</strong> (a partir de <strong>{formatarDataBR(minDate)}</strong>).
            </p>
          </div>

          {/* Data da Concessão */}
          <div className={`p-3.5 rounded-xl border space-y-1.5 transition-colors ${
            isDataWithinTermino
              ? 'bg-red-50/50 border-red-300'
              : 'bg-purple-50/80 border-purple-200'
          }`}>
            <label className="block font-bold text-purple-950 text-xs flex items-center justify-between">
              <span>Data da Concessão da Licença Permanente *</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isDataWithinTermino
                  ? 'bg-red-100 text-red-800'
                  : 'bg-purple-200 text-purple-900'
              }`}>
                Mínimo permitido: {formatarDataBR(minDate)}
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                min={minDate}
                value={dataConcessao}
                onChange={e => {
                  const val = e.target.value;
                  setDataConcessao(val);
                  if (val && occurrence.data_termino && val <= occurrence.data_termino) {
                    setError(`A licença permanente não poderá ser concedida dentro do prazo vigente de licença (até ${formatarDataBR(occurrence.data_termino)}). A Data da Concessão deve ser a partir de ${formatarDataBR(minDate)}.`);
                  } else {
                    setError('');
                  }
                }}
                className={`w-full px-3 py-2 font-mono text-xs bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-900 shadow-2xs font-semibold ${
                  isDataWithinTermino
                    ? 'border-red-400 focus:ring-red-500 bg-red-50/40 text-red-950'
                    : 'border-purple-300 focus:ring-purple-600'
                }`}
              />
              <Calendar className={`w-4 h-4 absolute right-3 top-2.5 pointer-events-none ${
                isDataWithinTermino ? 'text-red-500' : 'text-purple-600'
              }`} />
            </div>
            {isDataWithinTermino ? (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Inválido: A concessão não pode ocorrer dentro do prazo vigente da licença (até {formatarDataBR(occurrence.data_termino)}).</span>
              </p>
            ) : (
              <p className="text-[11px] text-purple-800">
                A data deve ser posterior a <strong>{formatarDataBR(occurrence.data_termino)}</strong>, marcando o início da concessão permanente.
              </p>
            )}
          </div>

          {/* Ato Concessório / Portaria */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Nº do Ato Concessório / Portaria / Processo <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              value={atoConcessao}
              onChange={e => setAtoConcessao(e.target.value)}
              placeholder="Ex: Portaria IPME nº 042/2026 ou Processo nº 2026/089"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            />
          </div>

          {/* Médico Perito Oficial & CRM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Médico Perito Oficial
              </label>
              {doctors && doctors.length > 0 ? (
                <select
                  value={medico}
                  onChange={e => handleDoctorSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                >
                  <option value="">Selecione o médico perito...</option>
                  {doctors.filter(d => d.ativo).map(d => (
                    <option key={d.id} value={d.nome}>
                      {d.nome} {d.is_diretor ? '(Diretor)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={medico}
                  onChange={e => setMedico(e.target.value)}
                  placeholder="Nome do Médico Perito"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Registro CRM
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={crm}
                  onChange={e => setCrm(e.target.value)}
                  placeholder="CRM/CE..."
                  className="w-full px-3 py-2 font-mono text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                />
                <Award className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Justificativa / Motivo */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Justificativa / Fundamento da Concessão Definitiva
            </label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ex: Incapacidade definitiva e permanente atestada por Junta Médica Oficial."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            />
          </div>

          {/* Parecer Conclusivo da Junta Médica */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Parecer Técnico Conclusivo da Junta Pericial
            </label>
            <textarea
              rows={3}
              value={parecerTecnico}
              onChange={e => setParecerTecnico(e.target.value)}
              placeholder="Descreva o parecer pericial oficial que fundamenta a transformação em definitiva..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-bold bg-purple-700 hover:bg-purple-600 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <FileBadge className="w-4 h-4" />
              <span>{loading ? 'Processando...' : 'Confirmar Licença Definitiva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
