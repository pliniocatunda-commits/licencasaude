import React, { useState, useEffect, useCallback } from 'react';
import { 
  Employee, 
  Occurrence, 
  AuditLog, 
  AppUser, 
  DashboardMetrics,
  Secretaria,
  Doctor
} from './types/index.ts';
import { api } from './services/api.ts';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { EmployeesView } from './components/EmployeesView.tsx';
import { SecretariasView } from './components/SecretariasView.tsx';
import { DoctorsView } from './components/DoctorsView.tsx';
import { OccurrencesView } from './components/OccurrencesView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { UsersView } from './components/UsersView.tsx';
import { EmployeeModal } from './components/EmployeeModal.tsx';
import { EmployeeDetailModal } from './components/EmployeeDetailModal.tsx';
import { SecretariaModal } from './components/SecretariaModal.tsx';
import { DoctorModal } from './components/DoctorModal.tsx';
import { OccurrenceModal } from './components/OccurrenceModal.tsx';
import { 
  ProrrogarModal, 
  ConcluirModal, 
  CancelarModal,
  ConverterDefinitivaModal
} from './components/OccurrenceActionsModal.tsx';
import { PrintCertificateModal } from './components/PrintCertificateModal.tsx';
import { ExecutiveReportLandscapeModal } from './components/ExecutiveReportLandscapeModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser>(() => api.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'secretarias' | 'doctors' | 'occurrences' | 'audit' | 'users'>('dashboard');

  // Core Data States
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null);

  const [secretariaModalOpen, setSecretariaModalOpen] = useState(false);
  const [selectedSecretariaForEdit, setSelectedSecretariaForEdit] = useState<Secretaria | null>(null);
  const [initialSecretariaFilterForEmployees, setInitialSecretariaFilterForEmployees] = useState<string | undefined>(undefined);

  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<Doctor | null>(null);

  const [employeeDetailModalOpen, setEmployeeDetailModalOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<(Employee & { history?: Occurrence[] }) | null>(null);

  const [occurrenceModalOpen, setOccurrenceModalOpen] = useState(false);
  const [selectedOccurrenceForEdit, setSelectedOccurrenceForEdit] = useState<Occurrence | null>(null);
  const [preselectedMatriculaForOcc, setPreselectedMatriculaForOcc] = useState<string | undefined>(undefined);

  const [prorrogarModalOpen, setProrrogarModalOpen] = useState(false);
  const [concluirModalOpen, setConcluirModalOpen] = useState(false);
  const [cancelarModalOpen, setCancelarModalOpen] = useState(false);
  const [converterDefinitivaModalOpen, setConverterDefinitivaModalOpen] = useState(false);
  const [targetOccurrence, setTargetOccurrence] = useState<Occurrence | null>(null);
  const [occurrenceToConvert, setOccurrenceToConvert] = useState<Occurrence | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printOccurrence, setPrintOccurrence] = useState<Occurrence | null>(null);

  const [executiveReportModalOpen, setExecutiveReportModalOpen] = useState(false);

  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Data Loading
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [m, emps, secs, docs, occs, logs, usrs] = await Promise.all([
        api.getStats(),
        api.getEmployees(),
        api.getSecretarias(),
        api.getDoctors(),
        api.getOccurrences(),
        api.getAuditLogs(),
        api.getUsers(),
      ]);
      setMetrics(m);
      setEmployees(emps);
      setSecretarias(secs);
      setDoctors(docs);
      setOccurrences(occs);
      setAuditLogs(logs);
      setUsers(usrs);
    } catch (error) {
      console.error('Failed to load data:', error);
      addToast('error', 'Erro ao carregar dados do servidor IPME.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.initUser();
    setCurrentUser(api.getCurrentUser());
    loadAllData();
  }, [loadAllData]);

  // Auth & User switching
  const handleSwitchUser = (user: AppUser) => {
    api.setCurrentUser(user);
    setCurrentUser(user);
    addToast('info', `Perfil ativo alterado para ${user.name} (${user.role.toUpperCase()})`);
    loadAllData();
  };

  const handleLogin = async (email: string, name?: string, provider: 'google' | 'corporate' = 'corporate') => {
    try {
      const user = await api.login(email, name, provider);
      setCurrentUser(user);
      addToast('success', `Bem-vindo(a), ${user.name}!`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Falha ao autenticar.');
    }
  };

  // Employee Handlers
  const handleOpenNewEmployee = () => {
    setSelectedEmployeeForEdit(null);
    setEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp?: Employee) => {
    setSelectedEmployeeForEdit(emp || null);
    setEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (empData: Partial<Employee>) => {
    try {
      if (selectedEmployeeForEdit) {
        await api.updateEmployee(selectedEmployeeForEdit.matricula, empData);
        addToast('success', `Cadastro de ${empData.nome} atualizado com sucesso.`);
      } else {
        await api.createEmployee(empData);
        addToast('success', `Servidor ${empData.nome} (${empData.matricula}) cadastrado com sucesso.`);
      }
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao salvar servidor.');
      throw err;
    }
  };

  const handleDeleteEmployee = async (matricula: string) => {
    try {
      await api.deleteEmployee(matricula);
      addToast('success', `Servidor ${matricula} excluído com sucesso.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao excluir servidor.');
    }
  };

  const handleViewEmployeeDetail = async (emp: Employee) => {
    try {
      const full = await api.getEmployee(emp.matricula);
      setSelectedEmployeeForDetail(full);
      setEmployeeDetailModalOpen(true);
    } catch {
      setSelectedEmployeeForDetail({ ...emp, history: occurrences.filter(o => o.matricula === emp.matricula) });
      setEmployeeDetailModalOpen(true);
    }
  };

  const handleViewEmployeeDetailByMatricula = async (matricula: string) => {
    try {
      const full = await api.getEmployee(matricula);
      setSelectedEmployeeForDetail(full);
      setEmployeeDetailModalOpen(true);
    } catch (err) {
      addToast('error', 'Servidor não encontrado.');
    }
  };

  // Secretaria Handlers
  const handleOpenNewSecretaria = () => {
    setSelectedSecretariaForEdit(null);
    setSecretariaModalOpen(true);
  };

  const handleEditSecretaria = (sec: Secretaria) => {
    setSelectedSecretariaForEdit(sec);
    setSecretariaModalOpen(true);
  };

  const handleSaveSecretaria = async (secData: Partial<Secretaria>) => {
    try {
      if (selectedSecretariaForEdit) {
        await api.updateSecretaria(selectedSecretariaForEdit.id, secData);
        addToast('success', `Secretaria ${secData.sigla} (${secData.nome}) atualizada com sucesso.`);
      } else {
        const created = await api.createSecretaria(secData);
        addToast('success', `Secretaria ${created.sigla} (${created.nome}) cadastrada com sucesso.`);
      }
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao salvar secretaria.');
      throw err;
    }
  };

  const handleDeleteSecretaria = async (id: string) => {
    try {
      await api.deleteSecretaria(id);
      addToast('success', 'Secretaria excluída com sucesso.');
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao excluir secretaria.');
      throw err;
    }
  };

  const handleToggleStatusSecretaria = async (sec: Secretaria) => {
    try {
      await api.updateSecretaria(sec.id, { ativa: !sec.ativa });
      addToast('info', `Status da Secretaria ${sec.sigla} alterado para ${!sec.ativa ? 'Ativa' : 'Inativa'}.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao alterar status da secretaria.');
    }
  };

  const handleFilterEmployeesBySecretaria = (secName: string) => {
    setInitialSecretariaFilterForEmployees(secName);
    setActiveTab('employees');
  };

  // Doctor Handlers
  const handleOpenNewDoctor = () => {
    setSelectedDoctorForEdit(null);
    setDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doc: Doctor) => {
    setSelectedDoctorForEdit(doc);
    setDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (docData: Partial<Doctor>) => {
    try {
      if (selectedDoctorForEdit) {
        await api.updateDoctor(selectedDoctorForEdit.id, docData);
        addToast('success', `Cadastro do Dr(a). ${docData.nome} atualizado com sucesso.`);
      } else {
        const created = await api.createDoctor(docData);
        addToast('success', `Médico ${created.nome} (${created.crm}) cadastrado com sucesso.`);
      }
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao salvar médico.');
      throw err;
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    try {
      await api.deleteDoctor(id);
      addToast('success', 'Médico excluído com sucesso.');
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao excluir médico.');
      throw err;
    }
  };

  const handleToggleStatusDoctor = async (id: string) => {
    try {
      const updated = await api.toggleDoctorStatus(id);
      addToast('info', `Status do Dr(a). ${updated.nome} alterado para ${updated.ativo ? 'Ativo' : 'Inativo'}.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao alterar status do médico.');
      throw err;
    }
  };

  const handleSetDiretorDoctor = async (id: string) => {
    try {
      const updated = await api.setDoctorDiretor(id);
      addToast('success', `${updated.nome} definido como Médico Diretor da Junta Pericial Oficial.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao definir médico diretor.');
      throw err;
    }
  };

  // Occurrence Handlers
  const handleOpenNewOccurrence = (preselectedMatricula?: string) => {
    setSelectedOccurrenceForEdit(null);
    setPreselectedMatriculaForOcc(preselectedMatricula);
    setOccurrenceModalOpen(true);
  };

  const handleOpenEditOccurrence = (occ: Occurrence) => {
    setSelectedOccurrenceForEdit(occ);
    setOccurrenceModalOpen(true);
  };

  const handleSaveOccurrence = async (occData: Partial<Occurrence>) => {
    try {
      if (selectedOccurrenceForEdit) {
        await api.updateOccurrence(selectedOccurrenceForEdit.id, occData);
        addToast('success', `Registro ${selectedOccurrenceForEdit.id} atualizado com sucesso.`);
      } else {
        const created = await api.createOccurrence(occData);
        addToast('success', `Ocorrência ${created.id} (${created.tipo}) homologada com sucesso.`);
      }
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao salvar ocorrência.');
      throw err;
    }
  };

  const handleDeleteOccurrence = async (id: string) => {
    try {
      await api.deleteOccurrence(id);
      addToast('success', `Ocorrência ${id} excluída permanentemente.`);
      loadAllData();
      if (selectedEmployeeForDetail) {
        // Refresh details for modal if open
        const updated = await api.getEmployeeByMatricula(selectedEmployeeForDetail.matricula);
        setSelectedEmployeeForDetail(updated);
      }
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao excluir ocorrência.');
    }
  };

  const handleClearAllOccurrences = async () => {
    try {
      const res = await api.clearOccurrences();
      addToast('success', `${res.deletedOccurrences} ocorrência(s) excluída(s). Todos os servidores foram mantidos e estão no status Ativo.`);
      loadAllData();
      if (selectedEmployeeForDetail) {
        setSelectedEmployeeForDetail(prev => prev ? { ...prev, status: 'Ativo', history: [] } : null);
      }
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao limpar licenças.');
    }
  };

  const handleOpenProrrogar = (occ: Occurrence) => {
    setTargetOccurrence(occ);
    setProrrogarModalOpen(true);
  };

  const handleConfirmProrrogar = async (data: { novaDataTermino: string; motivo: string; medico?: string; crm?: string }) => {
    if (!targetOccurrence) return;
    try {
      await api.prorrogarOccurrence(targetOccurrence.id, data);
      addToast('success', `Afastamento ${targetOccurrence.id} prorrogado até ${data.novaDataTermino}.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao prorrogar afastamento.');
      throw err;
    }
  };

  const handleOpenConcluir = (occ: Occurrence) => {
    setTargetOccurrence(occ);
    setConcluirModalOpen(true);
  };

  const handleConfirmConcluir = async (parecerFinal: string) => {
    if (!targetOccurrence) return;
    try {
      await api.concluirOccurrence(targetOccurrence.id, parecerFinal);
      addToast('success', `Perícia concluída. Servidor ${targetOccurrence.employee_nome} restaurado para status Ativo.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao concluir perícia.');
      throw err;
    }
  };

  const handleOpenCancelar = (occ: Occurrence) => {
    setTargetOccurrence(occ);
    setCancelarModalOpen(true);
  };

  const handleConfirmCancelar = async (motivo: string) => {
    if (!targetOccurrence) return;
    try {
      await api.cancelarOccurrence(targetOccurrence.id, motivo);
      addToast('info', `Registro ${targetOccurrence.id} cancelado.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao cancelar ocorrência.');
      throw err;
    }
  };

  const handleOpenConverterDefinitiva = (occ: Occurrence) => {
    setOccurrenceToConvert(occ);
    setConverterDefinitivaModalOpen(true);
  };

  const handleConfirmConverterDefinitiva = async (data: {
    dataConcessao: string;
    atoConcessao?: string;
    motivo?: string;
    medico?: string;
    crm?: string;
    parecerTecnico?: string;
  }) => {
    if (!occurrenceToConvert) return;
    try {
      const updated = await api.converterOccurrenceDefinitiva(occurrenceToConvert.id, data);
      addToast('success', `Afastamento Nº ${updated.id} convertido em Licença Definitiva com sucesso. Data da Concessão: ${data.dataConcessao.split('-').reverse().join('/')}.`);
      await loadAllData();
      if (selectedEmployeeForDetail) {
        const empOccurrences = await api.getOccurrences(selectedEmployeeForDetail.matricula);
        setSelectedEmployeeForDetail(prev => prev ? { ...prev, history: empOccurrences } : null);
      }
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao converter para Licença Definitiva.');
      throw err;
    }
  };

  const handlePrintOccurrence = (occ: Occurrence) => {
    setPrintOccurrence(occ);
    setPrintModalOpen(true);
  };

  const handleSaveUser = async (userData: Partial<AppUser>) => {
    try {
      await api.saveUser(userData);
      addToast('success', `Permissões de ${userData.email} atualizadas.`);
      loadAllData();
    } catch (err) {
      addToast('error', (err as Error).message || 'Erro ao gerenciar usuário.');
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOccurrence={() => handleOpenNewOccurrence()}
        onOpenNewEmployee={handleOpenNewEmployee}
        onOpenExecutiveReport={() => setExecutiveReportModalOpen(true)}
        onSwitchUser={handleSwitchUser}
        onOpenLoginModal={() => setLoginModalOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            loading={loading}
            onNavigateTab={setActiveTab}
            onOpenNewOccurrence={handleOpenNewOccurrence}
            onOpenNewEmployee={handleOpenNewEmployee}
            onOpenProrrogar={handleOpenProrrogar}
            onOpenConcluir={handleOpenConcluir}
            onViewOccurrence={handlePrintOccurrence}
            onOpenExecutiveReport={() => setExecutiveReportModalOpen(true)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeesView
            employees={employees}
            userRole={currentUser.role}
            onRefresh={loadAllData}
            onOpenEmployeeModal={handleOpenEditEmployee}
            onViewEmployeeDetail={handleViewEmployeeDetail}
            onOpenNewOccurrenceForEmployee={matricula => handleOpenNewOccurrence(matricula)}
            onDeleteEmployee={handleDeleteEmployee}
            secretariasList={secretarias}
            initialSecretariaFilter={initialSecretariaFilterForEmployees}
            onClearSecretariaFilter={() => setInitialSecretariaFilterForEmployees(undefined)}
          />
        )}

        {activeTab === 'secretarias' && (
          <SecretariasView
            secretarias={secretarias}
            currentUser={currentUser}
            onOpenNewSecretaria={handleOpenNewSecretaria}
            onEditSecretaria={handleEditSecretaria}
            onDeleteSecretaria={handleDeleteSecretaria}
            onToggleStatusSecretaria={handleToggleStatusSecretaria}
            onFilterEmployeesBySecretaria={handleFilterEmployeesBySecretaria}
          />
        )}

        {activeTab === 'doctors' && (
          <DoctorsView
            doctors={doctors}
            userRole={currentUser.role}
            onRefresh={loadAllData}
            onOpenNewDoctor={handleOpenNewDoctor}
            onEditDoctor={handleOpenEditDoctor}
            onDeleteDoctor={handleDeleteDoctor}
            onToggleStatusDoctor={handleToggleStatusDoctor}
            onSetDiretorDoctor={handleSetDiretorDoctor}
          />
        )}

        {activeTab === 'occurrences' && (
          <OccurrencesView
            occurrences={occurrences}
            employees={employees}
            userRole={currentUser.role}
            onRefresh={loadAllData}
            onOpenNewOccurrence={() => handleOpenNewOccurrence()}
            onOpenEditOccurrence={handleOpenEditOccurrence}
            onOpenProrrogar={handleOpenProrrogar}
            onOpenConcluir={handleOpenConcluir}
            onOpenConverterDefinitiva={handleOpenConverterDefinitiva}
            onOpenCancelar={handleOpenCancelar}
            onPrintOccurrence={handlePrintOccurrence}
            onDeleteOccurrence={handleDeleteOccurrence}
            onClearAllOccurrences={handleClearAllOccurrences}
            onViewEmployeeDetailByMatricula={handleViewEmployeeDetailByMatricula}
            onOpenExecutiveReport={() => setExecutiveReportModalOpen(true)}
            onOpenAuditTrail={() => setActiveTab('audit')}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView
            logs={auditLogs}
            loading={loading}
            onRefresh={loadAllData}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'admin' && (
          <UsersView
            users={users}
            currentUser={currentUser}
            onRefresh={loadAllData}
            onSaveUser={handleSaveUser}
          />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">IPME</span>
            <span>·</span>
            <span>Instituto de Previdência do Município de Eusébio</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500 font-mono">Regime Próprio de Previdência Social (RPPS)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Prefeitura Municipal de Eusébio - CE</span>
            <span>·</span>
            <span>Auditoria e Compliance em Tempo Real</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EmployeeModal
        isOpen={employeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        initialEmployee={selectedEmployeeForEdit}
        secretariasList={secretarias}
        onQuickCreateSecretaria={handleOpenNewSecretaria}
      />

      <SecretariaModal
        isOpen={secretariaModalOpen}
        onClose={() => setSecretariaModalOpen(false)}
        onSave={handleSaveSecretaria}
        initialSecretaria={selectedSecretariaForEdit}
      />

      <EmployeeDetailModal
        isOpen={employeeDetailModalOpen}
        onClose={() => setEmployeeDetailModalOpen(false)}
        employee={selectedEmployeeForDetail}
        onOpenNewOccurrence={matricula => {
          setEmployeeDetailModalOpen(false);
          handleOpenNewOccurrence(matricula);
        }}
        onPrintOccurrence={handlePrintOccurrence}
        onOpenProrrogar={handleOpenProrrogar}
        onOpenConcluir={handleOpenConcluir}
        onOpenConverterDefinitiva={handleOpenConverterDefinitiva}
        onDeleteOccurrence={handleDeleteOccurrence}
        userRole={currentUser.role}
      />

      <DoctorModal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        onSave={handleSaveDoctor}
        initialDoctor={selectedDoctorForEdit}
      />

      <OccurrenceModal
        isOpen={occurrenceModalOpen}
        onClose={() => setOccurrenceModalOpen(false)}
        onSave={handleSaveOccurrence}
        employees={employees}
        doctors={doctors}
        initialOccurrence={selectedOccurrenceForEdit}
        preselectedMatricula={preselectedMatriculaForOcc}
      />

      <ProrrogarModal
        isOpen={prorrogarModalOpen}
        onClose={() => setProrrogarModalOpen(false)}
        occurrence={targetOccurrence}
        onConfirm={handleConfirmProrrogar}
      />

      <ConcluirModal
        isOpen={concluirModalOpen}
        onClose={() => setConcluirModalOpen(false)}
        occurrence={targetOccurrence}
        onConfirm={handleConfirmConcluir}
      />

      <CancelarModal
        isOpen={cancelarModalOpen}
        onClose={() => setCancelarModalOpen(false)}
        occurrence={targetOccurrence}
        onConfirm={handleConfirmCancelar}
      />

      <ConverterDefinitivaModal
        isOpen={converterDefinitivaModalOpen}
        onClose={() => {
          setConverterDefinitivaModalOpen(false);
          setOccurrenceToConvert(null);
        }}
        occurrence={occurrenceToConvert}
        doctors={doctors}
        onConfirm={handleConfirmConverterDefinitiva}
      />

      <PrintCertificateModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        occurrence={printOccurrence}
        employee={printOccurrence ? employees.find(e => e.matricula === printOccurrence.matricula) : undefined}
      />

      <ExecutiveReportLandscapeModal
        isOpen={executiveReportModalOpen}
        onClose={() => setExecutiveReportModalOpen(false)}
        occurrences={occurrences}
        employees={employees}
        secretarias={secretarias}
        metrics={metrics}
        doctors={doctors}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLogin}
        currentUser={currentUser}
      />

      {/* Floating Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl shadow-xl text-xs font-medium border animate-in slide-in-from-bottom-3 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900/95 text-red-100 border-red-700'
                : 'bg-slate-900/95 text-slate-100 border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
