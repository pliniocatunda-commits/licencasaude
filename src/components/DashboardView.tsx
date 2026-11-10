import React, { useMemo } from 'react';
import { DashboardMetrics, Occurrence } from '../types/index.ts';
import { formatarDataBR, calcularDiasPagos, isPrevisaoRetornoEmAtraso, calcularDiasAtraso } from '../utils/validation.ts';
import { useAppTheme } from '../context/ThemeContext.tsx';
import { 
  Users, 
  HeartPulse, 
  RefreshCw, 
  CalendarClock, 
  Building2, 
  ArrowRight, 
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  UserPlus,
  PlusCircle,
  FileSpreadsheet,
  Baby,
  Award,
  ShieldCheck
} from 'lucide-react';

export interface DashboardNavigationFilter {
  tipo?: string;
  status?: string;
  secretaria?: string;
  employeeStatus?: string;
  search?: string;
}

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  occurrences?: Occurrence[];
  loading: boolean;
  onNavigateTab: (
    tab: 'dashboard' | 'employees' | 'secretarias' | 'doctors' | 'occurrences' | 'audit' | 'users',
    filter?: DashboardNavigationFilter
  ) => void;
  onOpenNewOccurrence: (preselectedMatricula?: string) => void;
  onOpenNewEmployee: () => void;
  onOpenProrrogar: (occ: Occurrence) => void;
  onOpenConcluir: (occ: Occurrence) => void;
  onViewOccurrence: (occ: Occurrence) => void;
  onOpenExecutiveReport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  occurrences = [],
  loading,
  onNavigateTab,
  onOpenNewOccurrence,
  onOpenNewEmployee,
  onOpenProrrogar,
  onOpenConcluir,
  onViewOccurrence,
  onOpenExecutiveReport,
}) => {
  const { themeConfig } = useAppTheme();

  // Estatísticas dinâmicas estritamente separadas por tipo de ato pericial
  const statsSaude = useMemo(() => {
    if (occurrences && occurrences.length > 0) {
      const all = occurrences.filter(o => o.tipo === 'Licença Saúde');
      const ativas = all.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada').length;
      return { total: all.length, ativas };
    }
    const total = metrics?.totalLicencaSaude ?? 0;
    return { total, ativas: total };
  }, [occurrences, metrics]);

  const statsDefinitiva = useMemo(() => {
    if (occurrences && occurrences.length > 0) {
      const all = occurrences.filter(o => o.tipo === 'Licença Definitiva');
      const ativas = all.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada').length;
      const arquivadas = all.filter(o => o.status === 'Arquivado').length;
      return { total: all.length, ativas, arquivadas };
    }
    const total = metrics?.totalLicencaDefinitiva ?? 0;
    const arquivadas = metrics?.totalAposentados ?? 0;
    return { total, ativas: Math.max(0, total - arquivadas), arquivadas };
  }, [occurrences, metrics]);

  const statsReadaptacao = useMemo(() => {
    if (occurrences && occurrences.length > 0) {
      const all = occurrences.filter(o => o.tipo === 'Readaptação');
      const ativas = all.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada').length;
      return { total: all.length, ativas };
    }
    const total = metrics?.totalReadaptados ?? 0;
    return { total, ativas: total };
  }, [occurrences, metrics]);

  const statsReadaptacaoPermanente = useMemo(() => {
    if (occurrences && occurrences.length > 0) {
      const all = occurrences.filter(o => o.tipo === 'Readaptação Permanente');
      const ativas = all.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada').length;
      return { total: all.length, ativas };
    }
    const total = metrics?.totalReadaptacaoPermanente ?? 0;
    return { total, ativas: total };
  }, [occurrences, metrics]);

  const statsMaternidade = useMemo(() => {
    if (occurrences && occurrences.length > 0) {
      const all = occurrences.filter(o => o.tipo === 'Licença Maternidade');
      const ativas = all.filter(o => o.status === 'Ativa' || o.status === 'Prorrogada').length;
      return { total: all.length, ativas };
    }
    const total = metrics?.totalLicencaMaternidade ?? 0;
    return { total, ativas: total };
  }, [occurrences, metrics]);

  // Licenças saúde concluídas nos últimos 30 dias (altas periciais / retornos homologados)
  const statsSaudeConcluidas30d = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const todayStr = now.toISOString().split('T')[0];
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const isLast30d = (d?: string) => {
      if (!d) return false;
      const clean = d.split('T')[0];
      return clean >= thirtyDaysAgoStr && clean <= todayStr;
    };

    if (occurrences && occurrences.length > 0) {
      const all = occurrences.filter(o => {
        if (o.tipo !== 'Licença Saúde') return false;
        if (o.status !== 'Concluída') return false;
        return isLast30d(o.data_retorno) || isLast30d(o.updated_at) || isLast30d(o.data_termino);
      });
      return { total: all.length, list: all };
    }
    const total = metrics?.totalLicencaSaudeConcluida30d ?? 0;
    return { total, list: [] };
  }, [occurrences, metrics]);

  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Context Banner no Azul Institucional IPME */}
      <div className={`${themeConfig.heroBannerClass} rounded-2xl p-5 sm:p-6 text-white border ${themeConfig.heroBannerBorderClass} shadow-md`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-200 uppercase tracking-wider">
              <span>Gestão Previdenciária Municipal</span>
              <span>·</span>
              <span>Exercício 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Controle de Licenças Médicas & Readaptações
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl">
              Central oficial do IPME para acompanhamento pericial de servidores da Prefeitura Municipal de Eusébio, histórico pericial e controle temporal de afastamentos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {onOpenExecutiveReport && (
              <button
                onClick={onOpenExecutiveReport}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#2B5485] hover:bg-[#1E426D] text-white border border-[#5D8BBE]/80 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                title="Emitir Relatório Gerencial de Licenças & Readaptações em formato PDF Paisagem"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-100" />
                <span>Relatório Executivo PDF</span>
              </button>
            )}
            <button
              onClick={() => onOpenNewOccurrence()}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Afastamento</span>
            </button>
            <button
              onClick={onOpenNewEmployee}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer backdrop-blur-xs whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 text-blue-200" />
              <span>Novo Servidor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Strip (Distribuído em 2 linhas de 4 painéis: 4 acima e 4 abaixo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* LINHA 1 - CARDS 1 a 4 */}

        {/* Card 1: Total Servidores (Azul Institucional) */}
        <div 
          onClick={() => onNavigateTab('employees', { employeeStatus: 'ALL' })}
          className="bg-gradient-to-br from-[#1E426D]/15 via-blue-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-blue-200 shadow-xs hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para abrir e filtrar o Quadro Geral de Servidores"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-[#1E426D] uppercase tracking-wider">
                Quadro Geral
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-100/90 border border-blue-200/80 flex items-center justify-center text-[#1E426D] shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-[#0F223D] tabular-nums tracking-tight">
                {metrics.totalEmployees}
              </div>
              <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
                Servidores na base
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('employees', { employeeStatus: 'Ativo' });
            }}
            className="mt-3 pt-2.5 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-slate-600 hover:text-blue-900 transition-colors"
            title="Clique para filtrar apenas servidores em exercício ativo"
          >
            <span>Em exercício:</span>
            <span className="font-bold text-emerald-700 font-mono tabular-nums">
              {metrics.totalAtivos}
            </span>
          </div>
        </div>

        {/* Card 2: Licenças Médicas Ativas (Âmbar / Laranja) */}
        <div 
          onClick={() => onNavigateTab('occurrences', { tipo: 'Licença Saúde', status: 'ALL' })}
          className="bg-gradient-to-br from-amber-500/15 via-amber-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-amber-300 shadow-xs hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para filtrar ocorrências de Licença Saúde"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Licença Saúde
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-amber-950 tabular-nums tracking-tight">
                {statsSaude.total}
              </div>
              <div className="text-[11px] font-semibold text-amber-900/80 mt-0.5">
                Afastamentos médicos
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('occurrences', { tipo: 'Licença Saúde', status: 'Ativa' });
            }}
            className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-900/80 hover:text-amber-950 transition-colors"
            title="Clique para filtrar licenças saúde vigentes em gozo"
          >
            <span>Em gozo ativo:</span>
            <span className="font-bold font-mono tabular-nums text-amber-950">
              {statsSaude.ativas} ato(s)
            </span>
          </div>
        </div>

        {/* Card 3: Licença Definitiva / Aposentadorias (Purple / Roxo - Próxima à Licença Saúde) */}
        <div 
          onClick={() => onNavigateTab('occurrences', { tipo: 'Licença Definitiva', status: 'ALL' })}
          className="bg-gradient-to-br from-purple-500/15 via-purple-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-purple-300 shadow-xs hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para filtrar Licenças Definitivas e Aposentadorias"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-purple-900 uppercase tracking-wider">
                Licença Definitiva
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-100/90 border border-purple-200 flex items-center justify-center text-purple-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-purple-950 tabular-nums tracking-tight">
                {statsDefinitiva.total}
              </div>
              <div className="text-[11px] font-semibold text-purple-900/80 mt-0.5">
                Incapacidade definitiva
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('occurrences', { tipo: 'Licença Definitiva', status: 'ALL' });
            }}
            className="mt-3 pt-2.5 border-t border-purple-200/60 flex items-center justify-between text-[11px] text-purple-900/80 hover:text-purple-950 transition-colors"
            title="Clique para filtrar ocorrências definitivas"
          >
            <span>Vigentes / Arq:</span>
            <span className="font-bold font-mono tabular-nums text-purple-950">
              {statsDefinitiva.ativas} ativ. / {statsDefinitiva.arquivadas} arq.
            </span>
          </div>
        </div>

        {/* Card 4: Licenças Saúde Concluídas nos últimos 30 dias (Índigo / Conclusão & Retorno) */}
        <div 
          onClick={() => onNavigateTab('occurrences', { tipo: 'Licença Saúde', status: 'CONCLUIDAS_30_DIAS' })}
          className="bg-gradient-to-br from-indigo-500/15 via-indigo-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-indigo-300 shadow-xs hover:shadow-md hover:border-indigo-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para filtrar Licenças Saúde Concluídas nos últimos 30 dias (Altas periciais / Retornos)"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                Saúde Concluída
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100/90 border border-indigo-200 flex items-center justify-center text-indigo-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-indigo-950 tabular-nums tracking-tight">
                {statsSaudeConcluidas30d.total}
              </div>
              <div className="text-[11px] font-semibold text-indigo-900/80 mt-0.5">
                Concluídas últimos 30d
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('occurrences', { tipo: 'Licença Saúde', status: 'CONCLUIDAS_30_DIAS' });
            }}
            className="mt-3 pt-2.5 border-t border-indigo-200/60 flex items-center justify-between text-[11px] text-indigo-900/80 hover:text-indigo-950 transition-colors"
            title="Clique para listar todas as conclusões dos últimos 30 dias"
          >
            <span>Altas / Retornos:</span>
            <span className="font-bold font-mono tabular-nums text-indigo-950">
              Últimos 30 dias
            </span>
          </div>
        </div>

        {/* LINHA 2 - CARDS 5 a 8 */}

        {/* Card 5: Readaptações Funcionais em Curso (Sky / Ciano) */}
        <div 
          onClick={() => onNavigateTab('occurrences', { tipo: 'Readaptação', status: 'ALL' })}
          className="bg-gradient-to-br from-sky-500/15 via-sky-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-sky-300 shadow-xs hover:shadow-md hover:border-sky-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para filtrar servidores em Readaptação Funcional"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-sky-900 uppercase tracking-wider">
                Readaptação
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-100/90 border border-sky-200 flex items-center justify-center text-sky-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-sky-950 tabular-nums tracking-tight">
                {statsReadaptacao.total}
              </div>
              <div className="text-[11px] font-semibold text-sky-900/80 mt-0.5">
                Readaptações em curso
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('occurrences', { tipo: 'Readaptação', status: 'Ativa' });
            }}
            className="mt-3 pt-2.5 border-t border-sky-200/60 flex items-center justify-between text-[11px] text-sky-900/80 hover:text-sky-950 transition-colors"
            title="Clique para filtrar servidores readaptados ativos"
          >
            <span>Em exercício:</span>
            <span className="font-bold font-mono tabular-nums text-sky-900">
              {statsReadaptacao.ativas} ato(s)
            </span>
          </div>
        </div>

        {/* Card 6: Readaptação Permanente (Teal / Esmeralda Petróleo - Próxima à Readaptação) */}
        <div 
          onClick={() => onNavigateTab('occurrences', { tipo: 'Readaptação Permanente', status: 'ALL' })}
          className="bg-gradient-to-br from-teal-500/15 via-teal-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-teal-300 shadow-xs hover:shadow-md hover:border-teal-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para filtrar servidores em Readaptação Permanente homologada"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-teal-900 uppercase tracking-wider">
                Readaptação Permanente
              </span>
              <div className="w-8 h-8 rounded-lg bg-teal-100/90 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-teal-950 tabular-nums tracking-tight">
                {statsReadaptacaoPermanente.total}
              </div>
              <div className="text-[11px] font-semibold text-teal-900/80 mt-0.5">
                Fixação definitiva
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('occurrences', { tipo: 'Readaptação Permanente', status: 'Ativa' });
            }}
            className="mt-3 pt-2.5 border-t border-teal-200/60 flex items-center justify-between text-[11px] text-teal-900/80 hover:text-teal-950 transition-colors"
            title="Clique para filtrar servidores em readaptação permanente ativa"
          >
            <span>Em exercício perm.:</span>
            <span className="font-bold font-mono tabular-nums text-teal-900">
              {statsReadaptacaoPermanente.ativas} ato(s)
            </span>
          </div>
        </div>

        {/* Card 7: Licença Maternidade (Rose / Rosa) */}
        <div 
          onClick={() => onNavigateTab('occurrences', { tipo: 'Licença Maternidade', status: 'ALL' })}
          className="bg-gradient-to-br from-rose-500/15 via-rose-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-rose-300 shadow-xs hover:shadow-md hover:border-rose-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para filtrar apenas Licenças Maternidade"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                Licença Maternidade
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100/90 border border-rose-200 flex items-center justify-center text-rose-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <Baby className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-rose-950 tabular-nums tracking-tight">
                {statsMaternidade.total}
              </div>
              <div className="text-[11px] font-semibold text-rose-900/80 mt-0.5">
                Licenças maternidade
              </div>
            </div>
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onNavigateTab('occurrences', { tipo: 'Licença Maternidade', status: 'Ativa' });
            }}
            className="mt-3 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-[11px] text-rose-900/80 hover:text-rose-950 transition-colors"
            title="Clique para filtrar licenças maternidade vigentes em gozo"
          >
            <span>Em gozo ativo:</span>
            <span className="font-bold font-mono tabular-nums text-rose-950">
              {statsMaternidade.ativas} ato(s)
            </span>
          </div>
        </div>

        {/* Card 8: Reavaliação Pericial / Prazos a Vencer (Emerald / Verde) */}
        <div 
          onClick={() => onNavigateTab('occurrences', { tipo: 'ALL', status: 'VENCENDO_30_DIAS' })}
          className="bg-gradient-to-br from-emerald-500/15 via-emerald-50/80 to-white rounded-xl p-4 sm:p-4.5 border border-emerald-300 shadow-xs hover:shadow-md hover:border-emerald-400 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group cursor-pointer"
          title="Clique para filtrar perícias com vencimento nos próximos 30 dias"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-emerald-900 uppercase tracking-wider">
                Reavaliação Pericial
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/90 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-emerald-950 tabular-nums tracking-tight">
                {metrics.expiringSoon.length}
              </div>
              <div className="text-[11px] font-semibold text-emerald-900/80 mt-0.5">
                Vencem em até 30 dias
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-900/80">
            <span>Previsão de retorno:</span>
            <span className="font-bold text-emerald-900">
              Próximos 30d
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Expirations & Secretariat Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 cols): Reavaliações & Afastamentos Vencendo */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-purple-600" />
                <span>Afastamentos com Vencimento Próximo (Próximos 30 dias)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Servidores com previsão de retorno que requerem perícia de retorno ou homologação de prorrogação.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('occurrences', { tipo: 'ALL', status: 'VENCENDO_30_DIAS' })}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              title="Filtrar todas as ocorrências que vencem nos próximos 30 dias"
            >
              <span>Ver todos ({metrics.expiringSoon.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6">
            {metrics.expiringSoon.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-slate-700">Nenhum afastamento vencendo nos próximos 30 dias.</p>
                <p className="text-xs text-slate-500">Todas as licenças e readaptações estão com prazos regulares.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.expiringSoon.map(occ => (
                  <div key={occ.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-3 px-3 rounded-lg transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Nº {occ.id}
                        </span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                          occ.tipo === 'Licença Saúde' 
                            ? 'bg-amber-50 text-amber-800 border-amber-200' 
                            : occ.tipo === 'Readaptação'
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : occ.tipo === 'Readaptação Permanente'
                            ? 'bg-teal-50 text-teal-800 border-teal-300 font-bold'
                            : occ.tipo === 'Licença Definitiva'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-pink-50 text-pink-800 border-pink-200'
                        }`}>
                          {occ.tipo}
                        </span>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs font-semibold text-slate-900">
                          {occ.employee_nome}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="font-mono font-medium text-slate-600">{occ.matricula}</span>
                        <span>·</span>
                        <span>{occ.employee_secretaria?.split(' - ')[0] || occ.employee_secretaria}</span>
                        <span>·</span>
                        <span className="text-slate-600">{occ.employee_cargo}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                        {isPrevisaoRetornoEmAtraso(occ.data_termino, occ.status, occ.tipo) ? (
                          <span className="flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold font-mono tabular-nums" title={`Previsão de retorno expirada há ${calcularDiasAtraso(occ.data_termino)} dias`}>
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                            Término previsto: {formatarDataBR(occ.data_termino)} ({calcularDiasAtraso(occ.data_termino)}d em atraso)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-purple-700 font-semibold font-mono tabular-nums">
                            <Clock className="w-3 h-3" />
                            Término previsto: {formatarDataBR(occ.data_termino)}
                          </span>
                        )}
                        <span>({occ.quantidade_dias}d totais · <strong className="text-emerald-700 font-mono">{calcularDiasPagos(occ.quantidade_dias)}d pagos IPME</strong>)</span>
                        {occ.cid && (
                          <span className="text-slate-500 font-mono text-[11px]">
                            CID: {occ.cid.split(' - ')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => onViewOccurrence(occ)}
                        className="px-2.5 py-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                      >
                        Prontuário
                      </button>
                      <button
                        onClick={() => onOpenProrrogar(occ)}
                        className="px-2.5 py-1 text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded font-medium transition-colors"
                      >
                        Prorrogar
                      </button>
                      <button
                        onClick={() => onOpenConcluir(occ)}
                        className="px-2.5 py-1 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold transition-colors"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Distribution by Secretariat */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Afastamentos por Secretaria</span>
            </h2>
            <button
              onClick={() => onNavigateTab('secretarias')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Gerenciar Secretarias
            </button>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {metrics.secretariaBreakdown.map(sec => {
                const totalAfastados = sec.licencaCount + sec.readaptadoCount;
                const percentage = sec.count > 0 ? Math.round((totalAfastados / sec.count) * 100) : 0;
                
                return (
                  <div key={sec.secretaria} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={sec.secretaria}>
                        {sec.secretaria}
                      </span>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600">
                        <span>{totalAfastados} afastados</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{sec.count} total</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex">
                      <div 
                        className="bg-amber-500 h-full" 
                        style={{ width: `${sec.count > 0 ? (sec.licencaCount / sec.count) * 100 : 0}%` }}
                        title={`${sec.licencaCount} em Licença Saúde`}
                      />
                      <div 
                        className="bg-sky-500 h-full" 
                        style={{ width: `${sec.count > 0 ? (sec.readaptadoCount / sec.count) * 100 : 0}%` }}
                        title={`${sec.readaptadoCount} Readaptados`}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{sec.licencaCount} licenças · {sec.readaptadoCount} readaptações</span>
                      <span>{percentage}% do quadro</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Export Guide */}
            <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Relatórios oficiais em formato CSV/Excel</span>
              </div>
              <button
                onClick={() => onNavigateTab('occurrences')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Gerar Planilha
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
