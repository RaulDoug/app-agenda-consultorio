import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppShell } from './components/layout/AppShell.js';
import { type NavTabId } from './components/layout/BottomNav.js';
import { CliniAssistLocalDB, localDb } from './db/local-db.js';
import { type LocalPatient, type LocalProcedure } from './db/types.js';
import { ProcedureList } from './features/procedures/components/ProcedureList.js';
import { ProcedureFormModal } from './features/procedures/components/ProcedureFormModal.js';
import { ConfirmDeleteProcedureModal } from './features/procedures/components/ConfirmDeleteProcedureModal.js';
import { AppointmentLocalRepository } from './db/repositories/appointment-local-repository.js';
import { PatientLocalRepository } from './db/repositories/patient-local-repository.js';
import { ProcedureLocalRepository } from './db/repositories/procedure-local-repository.js';
import { FinancialLocalRepository } from './db/repositories/financial-local-repository.js';
import { SettingsLocalRepository } from './db/repositories/settings-local-repository.js';
import { useConnectionStatus } from './hooks/useConnectionStatus.js';

// Features
import { ScheduleGrid } from './features/agenda/components/ScheduleGrid.js';
import { ViewModeSelector } from './features/agenda/components/ViewModeSelector.js';
import { QuickAppointmentDrawer } from './features/agenda/components/QuickAppointmentDrawer.js';
import { AppointmentDetailsDrawer } from './features/agenda/components/AppointmentDetailsDrawer.js';
import { RescheduleModal } from './features/agenda/components/RescheduleModal.js';
import { type ViewMode, type LocalAppointmentWithDetails } from './features/agenda/types.js';
import { getAgendaPeriodRange, countAppointmentsInPeriod } from './features/agenda/utils/date-formatters.js';

import { PatientList } from './features/patients/components/PatientList.js';
import { PatientFinancialDrawer } from './features/patients/components/PatientFinancialDrawer.js';

import { CashFlowDashboard } from './features/analytics/components/CashFlowDashboard.js';
import { InactivePatientsList } from './features/analytics/components/InactivePatientsList.js';
import { QuickExpenseModal } from './features/checkout/components/QuickExpenseModal.js';
import { CheckoutDrawer, type CheckoutResult } from './features/checkout/components/CheckoutDrawer.js';
import { InstallmentsForm } from './features/checkout/components/InstallmentsForm.js';
import { SmartReturnDrawer } from './features/checkout/components/SmartReturnDrawer.js';

import { SettingsView } from './features/settings/components/SettingsView.js';
import { ReportsView } from './features/analytics/components/ReportsView.js';
import { MoreMenuHub } from './components/layout/MoreMenuHub.js';
import { WhatsappQueueView } from './features/whatsapp/components/WhatsappQueueView.js';
import { CreatePatientModal } from './features/patients/components/CreatePatientModal.js';
import { ConfirmDeletePatientModal } from './features/patients/components/ConfirmDeletePatientModal.js';
import { LogoutConfirmDrawer } from './features/auth/components/LogoutConfirmDrawer.js';
import { useAuth } from './features/auth/hooks/useAuth.js';
import { SyncManager } from './sync/sync-manager.js';
import { type LocalAuthSession } from './db/types.js';
import { ApiClient } from './services/api-client.js';
import { Plus } from 'lucide-react';
import { getSmartDefaultAppointmentDateTime } from './features/agenda/utils/time-slots.js';

export interface AppProps {
  initialTab?: NavTabId;
  db?: CliniAssistLocalDB;
  tenantId?: string;
  initialWhatsappConnected?: boolean;
  session?: LocalAuthSession | null;
  apiClient?: ApiClient;
  onLogout?: () => void;
}

export const App: React.FC<AppProps> = ({
  initialTab = 'agenda',
  db = localDb,
  tenantId: tenantIdProp,
  initialWhatsappConnected = true,
  session,
  apiClient,
  onLogout,
}) => {
  const tenantId = session?.tenant?.id || tenantIdProp || '11111111-1111-1111-1111-111111111111';
  const [activeTab, setActiveTab] = useState<NavTabId>(initialTab);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(initialWhatsappConnected);
  const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);

  const [isLogoutDrawerOpen, setIsLogoutDrawerOpen] = useState(false);
  const [pendingOutboxCount, setPendingOutboxCount] = useState(0);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`;
    }
    return headers;
  }, [session?.token]);

  // Efeito de busca do status da sessão WhatsApp e polling quando desconectado
  const fetchWhatsappSession = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/session', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappConnected(Boolean(data.connected));
        if (data.connected) {
          setWhatsappQrCode(null);
          if (data.number) setConnectedNumber(data.number);
        } else if (data.qrcode) {
          setWhatsappQrCode(data.qrcode);
        }
      }
    } catch {
      // Offline ou ambiente de testes
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchWhatsappSession();
  }, [fetchWhatsappSession]);

  // Polling leve a cada 3s quando na aba Ajustes e desconectado
  useEffect(() => {
    if (activeTab !== 'ajustes' || whatsappConnected) return;

    const interval = setInterval(() => {
      fetchWhatsappSession();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeTab, whatsappConnected, fetchWhatsappSession]);

  // Sincronização delta periódica em segundo plano (atualiza agendamentos confirmados via WhatsApp)
  const syncManager = useMemo(
    () => new SyncManager({ tenantId, token: session?.token, db, onUnauthorized: onLogout }),
    [tenantId, session?.token, db, onLogout]
  );

  const runSync = useCallback(async () => {
    try {
      await syncManager.sync();
    } catch {
      // Offline ou ambiente de testes
    }
  }, [syncManager]);

  useEffect(() => {
    runSync();
    const syncInterval = setInterval(runSync, 4000);
    return () => clearInterval(syncInterval);
  }, [runSync]);

  const handleRefreshWhatsapp = async () => {
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.qrcode) setWhatsappQrCode(data.qrcode);
      }
    } catch {
      // Fallback
    }
    await fetchWhatsappSession();
  };

  const handleDisconnectWhatsapp = async () => {
    try {
      await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch {
      // Fallback
    }
    setWhatsappConnected(false);
    await fetchWhatsappSession();
  };

  const handleRequestLogout = useCallback(async () => {
    try {
      // 1. Tenta flush imediato da outbox antes de checar pendências
      if (syncManager) {
        try {
          await syncManager.push();
        } catch {
          // Erro de rede ou offline
        }
      }

      // 2. Verifica pendências remanescentes
      const count = await db.sync_outbox.where('status').equals('PENDING').count();
      setPendingOutboxCount(count);
      if (count > 0) {
        setIsLogoutDrawerOpen(true);
      } else if (onLogout) {
        onLogout();
      }
    } catch {
      if (onLogout) onLogout();
    }
  }, [db, onLogout, syncManager]);

  const handleConfirmLogout = useCallback(async () => {
    setIsLogoutDrawerOpen(false);
    if (onLogout) {
      await onLogout();
    }
  }, [onLogout]);

  // Repositórios com banco injetado
  const appointmentRepo = useMemo(() => new AppointmentLocalRepository(db), [db]);
  const patientRepo = useMemo(() => new PatientLocalRepository(db), [db]);
  const procedureRepo = useMemo(() => new ProcedureLocalRepository(db), [db]);
  const financialRepo = useMemo(() => new FinancialLocalRepository(db), [db]);
  const settingsRepo = useMemo(() => new SettingsLocalRepository(db), [db]);

  // Status de conexão
  const { connectionStatus } = useConnectionStatus();

  // Dados reativos do Dexie
  const allPatients = useLiveQuery(() => db.patients.toArray(), [db]) || [];
  const activePatients = useMemo(() => allPatients.filter((p) => p.is_active), [allPatients]);
  const appointments = useLiveQuery(() => db.appointments.toArray(), [db]) || [];
  const appointmentItems = useLiveQuery(() => db.appointment_items.toArray(), [db]) || [];
  const procedures = useLiveQuery(() => db.procedures.toArray(), [db]) || [];
  const activeProcedures = useMemo(
    () => procedures.filter((p) => p.is_active !== false && !p.deleted_at),
    [procedures]
  );
  const allTransactions = useLiveQuery(() => db.financial_transactions.toArray(), [db]) || [];
  const transactions = useMemo(
    () => allTransactions.filter((tx) => tx.is_active !== false && !tx.deleted_at),
    [allTransactions]
  );

  // Estado da Agenda
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  // Modais e Drawers da Agenda
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [quickSlotTime, setQuickSlotTime] = useState('08:00');
  const [quickPatient, setQuickPatient] = useState<LocalPatient | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<LocalAppointmentWithDetails | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<LocalAppointmentWithDetails | null>(null);
  const [whatsappRefreshTrigger, setWhatsappRefreshTrigger] = useState(0);

  // Modais de Caixa / Checkout / Retorno / Pacientes
  const [checkoutAppointment, setCheckoutAppointment] = useState<LocalAppointmentWithDetails | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<LocalPatient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<LocalPatient | null>(null);
  const [isDeletePatientOpen, setIsDeletePatientOpen] = useState(false);
  const [smartReturnData, setSmartReturnData] = useState<{
    patientId: string;
    patientName: string;
    baseDate: Date;
    preferredTimeStr: string;
  } | null>(null);
  const [patientForFinancial, setPatientForFinancial] = useState<LocalPatient | null>(null);

  // Modais de Procedimentos
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<LocalProcedure | null>(null);
  const [isDeleteProcedureOpen, setIsDeleteProcedureOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<LocalProcedure | null>(null);

  const handleConfirmDeleteProcedure = async (proc: LocalProcedure) => {
    await procedureRepo.deleteProcedure(proc.id);
    setIsDeleteProcedureOpen(false);
    setProcedureToDelete(null);
    if (editingProcedure?.id === proc.id) {
      setIsProcedureModalOpen(false);
      setEditingProcedure(null);
    }
  };

  const handleReactivateProcedure = async (proc: LocalProcedure) => {
    await procedureRepo.reactivateProcedure(proc.id);
  };

  const handleConfirmDeletePatient = async (patient: LocalPatient) => {
    await patientRepo.deletePatient(patient.id);
    setIsDeletePatientOpen(false);
    setPatientToDelete(null);
    if (editingPatient?.id === patient.id) {
      setIsCreatePatientOpen(false);
      setEditingPatient(null);
    }
  };

  // Agendamentos enriquecidos para exibição na grade
  const detailedAppointments: LocalAppointmentWithDetails[] = useMemo(() => {
    const patientMap = new Map(allPatients.map((p) => [p.id, p]));
    const procedureMap = new Map(procedures.map((pr) => [pr.id, pr]));

    const itemsByApp = new Map<string, typeof procedures>();
    for (const item of appointmentItems) {
      const proc = procedureMap.get(item.procedure_id);
      if (proc) {
        const current = itemsByApp.get(item.appointment_id) || [];
        current.push(proc);
        itemsByApp.set(item.appointment_id, current);
      }
    }

    return appointments.map((app) => {
      const patient = patientMap.get(app.patient_id);
      const appProcedures = itemsByApp.get(app.id) || [];
      return {
        id: app.id,
        tenant_id: app.tenant_id,
        patient_id: app.patient_id,
        patient_name: patient?.name || 'Paciente sem nome',
        patient_whatsapp: patient?.whatsapp,
        start_time: app.start_time,
        end_time: app.end_time,
        status: app.status,
        is_extra_fit: app.is_extra_fit,
        notes: app.notes,
        procedures: appProcedures,
      };
    });
  }, [appointments, allPatients, procedures, appointmentItems]);

  // Contagem de atendimentos no período atual da agenda (AC-205)
  const periodAppointmentsCount = useMemo(() => {
    const range = getAgendaPeriodRange(currentDate, viewMode);
    return countAppointmentsInPeriod(detailedAppointments, range);
  }, [detailedAppointments, currentDate, viewMode]);

  // Manipuladores de Slot e Agendamento
  const handleSlotClick = (date: Date, timeStr: string) => {
    setCurrentDate(date);
    setQuickSlotTime(timeStr);
    setQuickPatient(null);
    setIsQuickOpen(true);
  };

  const handleOpenSmartQuickAppointment = (patient: LocalPatient | null = null) => {
    const smart = getSmartDefaultAppointmentDateTime(new Date(), currentDate);
    setCurrentDate(smart.date);
    setQuickSlotTime(smart.timeStr);
    setQuickPatient(patient);
    setIsQuickOpen(true);
  };

  const handlePrevDate = () => {
    setCurrentDate((prev) => {
      if (viewMode === 'week') {
        return new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, prev.getDate());
      }
      return new Date(prev.getTime() - 24 * 60 * 60 * 1000);
    });
  };

  const handleNextDate = () => {
    setCurrentDate((prev) => {
      if (viewMode === 'week') {
        return new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, prev.getDate());
      }
      return new Date(prev.getTime() + 24 * 60 * 60 * 1000);
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Concluir Checkout e gerar transações
  const handleCompleteCheckout = async (result: CheckoutResult) => {
    const procedureTitle =
      checkoutAppointment?.procedures && checkoutAppointment.procedures.length > 0
        ? checkoutAppointment.procedures.map((p) => p.name).join(', ')
        : 'Atendimento Concluído';

    if (result.paymentMethod === 'PARCELADO' || (result.installments && result.installments.length > 0)) {
      let installmentsList = result.installments;

      if (!installmentsList || installmentsList.length === 0) {
        const count = result.installmentsCount || 1;
        const entry = result.entryCents || 0;
        const remaining = result.totalCents - entry;
        const installmentValue = Math.floor(remaining / count);
        const remainder = remaining % count;

        installmentsList = [];
        if (entry > 0) {
          installmentsList.push({
            installmentNumber: 0,
            totalInstallments: count,
            dueDate: new Date().toISOString().split('T')[0],
            amountCents: entry,
            status: 'PAID' as const,
            paymentDate: new Date().toISOString(),
            description: `Entrada - ${procedureTitle}`,
          });
        }

        for (let i = 1; i <= count; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() + i);
          installmentsList.push({
            installmentNumber: i,
            totalInstallments: count,
            dueDate: d.toISOString().split('T')[0],
            amountCents: i === 1 ? installmentValue + remainder : installmentValue,
            status: 'PENDING' as const,
            paymentDate: null,
            description: `${procedureTitle} (${i}/${count})`,
          });
        }
      }

      await financialRepo.recordCheckout({
        tenantId,
        appointmentId: result.appointmentId,
        totalCents: result.totalCents,
        paymentMethod: result.paymentMethod,
        installments: installmentsList,
      });
    } else {
      await financialRepo.recordCheckout({
        tenantId,
        appointmentId: result.appointmentId,
        totalCents: result.totalCents,
        paymentMethod: result.paymentMethod,
        installments: [
          {
            installmentNumber: 1,
            totalInstallments: 1,
            dueDate: new Date().toISOString().split('T')[0],
            amountCents: result.totalCents,
            status: 'PAID' as const,
            paymentDate: new Date().toISOString(),
            description: procedureTitle,
          },
        ],
      });
    }

    await appointmentRepo.updateStatus(result.appointmentId, 'COMPLETED');
    setCheckoutAppointment(null);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onQuickAppointment={() => handleOpenSmartQuickAppointment(null)}
      clinicName={session?.tenant?.name || 'CliniAssist'}
      connectionStatus={connectionStatus}
      whatsappConnected={whatsappConnected}
    >
      {/* ABA 1: AGENDA */}
      <div data-testid="agenda-tab-content" className={activeTab === 'agenda' ? 'space-y-4' : 'hidden'}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Agenda de Atendimentos</h2>
            <p className="text-xs text-slate-500">Visualização diária, semanal e mensal com agendamento rápido.</p>
          </div>
          <button
            type="button"
            data-testid="btn-new-appointment-top"
            onClick={() => handleOpenSmartQuickAppointment(null)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </div>

        <ViewModeSelector
          currentDate={currentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onPrevDate={handlePrevDate}
          onNextDate={handleNextDate}
          onToday={handleToday}
          appointmentsCount={periodAppointmentsCount}
        />

        <ScheduleGrid
          currentDate={currentDate}
          viewMode={viewMode}
          appointments={detailedAppointments}
          onSlotClick={handleSlotClick}
          onAppointmentClick={(app) => setSelectedAppointment(app)}
          onMarkNoShow={(appId) => appointmentRepo.updateStatus(appId, 'NO_SHOW')}
          onReschedule={(app) => setRescheduleAppointment(app)}
          onSelectDate={(day) => {
            setCurrentDate(day);
            setViewMode('day');
          }}
        />
      </div>

      {/* ABA 2: CLIENTES */}
      <div data-testid="clientes-tab-content" className={activeTab === 'clientes' ? 'space-y-4' : 'hidden'}>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clientes & Pacientes</h2>
          <p className="text-xs text-slate-500">Base integrada com histórico de atendimentos e atalhos rápidos.</p>
        </div>

        <PatientList
          tenantId={tenantId}
          patients={activePatients}
          appointments={appointments}
          transactions={transactions}
          onOpenCreateModal={() => {
            setEditingPatient(null);
            setIsCreatePatientOpen(true);
          }}
          onEditPatient={(patient) => {
            setEditingPatient(patient);
            setIsCreatePatientOpen(true);
          }}
          onDeletePatient={(patient) => {
            setPatientToDelete(patient);
            setIsDeletePatientOpen(true);
          }}
          onOpenFinancial={(patient) => {
            setPatientForFinancial(patient);
          }}
          onSchedule={(pw) => {
            setActiveTab('agenda');
            handleOpenSmartQuickAppointment(pw.patient);
          }}
        />
      </div>

      {/* ABA 3: CAIXA & FINANCEIRO */}
      <div data-testid="caixa-tab-content" className={activeTab === 'caixa' ? 'space-y-6' : 'hidden'}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Fluxo de Caixa & Finanças</h2>
            <p className="text-xs text-slate-500">Controle diário, DRE simples cumulativo, baixas e despesas.</p>
          </div>
          <button
            type="button"
            data-testid="btn-open-expense-modal"
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Nova Despesa
          </button>
        </div>

        <CashFlowDashboard
          transactions={transactions}
          financialRepo={financialRepo}
          token={session?.token}
          patients={activePatients}
          appointments={appointments}
          procedures={procedures}
          appointmentItems={appointmentItems}
        />

        <InactivePatientsList
          patients={activePatients}
          appointments={appointments}
          onSchedule={(patient) => {
            setActiveTab('agenda');
            handleOpenSmartQuickAppointment(patient);
          }}
        />
      </div>

      {/* ABA 4: AJUSTES */}
      <div data-testid="ajustes-tab-content" className={activeTab === 'ajustes' ? 'block' : 'hidden'}>
        <SettingsView
          tenantId={tenantId}
          tenantName={session?.tenant?.name}
          tenantEmail={session?.tenant?.email}
          onRequestLogout={handleRequestLogout}
          repo={settingsRepo}
          whatsappConnected={whatsappConnected}
          qrCodeBase64={whatsappQrCode}
          connectedNumber={connectedNumber}
          onRefreshWhatsApp={handleRefreshWhatsapp}
          onDisconnectWhatsApp={handleDisconnectWhatsapp}
          token={session?.token}
        />
      </div>

      {/* ABA 5: RELATÓRIOS & MÉTRICAS */}
      <div data-testid="relatorios-tab-content" className={activeTab === 'relatorios' ? 'block' : 'hidden'}>
        <ReportsView
          appointments={appointments}
          appointmentItems={appointmentItems}
          procedures={procedures}
          transactions={transactions}
          patients={activePatients}
          token={session?.token}
        />
      </div>

      {/* ABA 6: MAIS (HUB MOBILE) */}
      <div data-testid="mais-tab-content" className={activeTab === 'mais' ? 'block' : 'hidden'}>
        <MoreMenuHub
          onSelectSection={(tab) => setActiveTab(tab)}
          patientCount={activePatients.length}
          procedureCount={activeProcedures.length}
        />
      </div>

      {/* ABA PROCEDIMENTOS */}
      <div data-testid="procedimentos-tab-content" className={activeTab === 'procedimentos' ? 'space-y-4' : 'hidden'}>
        <ProcedureList
          tenantId={tenantId}
          procedures={procedures}
          onOpenCreateModal={() => {
            setEditingProcedure(null);
            setIsProcedureModalOpen(true);
          }}
          onEditProcedure={(proc) => {
            setEditingProcedure(proc);
            setIsProcedureModalOpen(true);
          }}
          onDeleteProcedure={(proc) => {
            setProcedureToDelete(proc);
            setIsDeleteProcedureOpen(true);
          }}
          onReactivateProcedure={handleReactivateProcedure}
        />
      </div>

      {/* ABA 7: FILA DE ENVIOS WHATSAPP */}
      <div data-testid="whatsapp-tab-content" className={activeTab === 'whatsapp' ? 'block' : 'hidden'}>
        <WhatsappQueueView
          token={session?.token}
          onSync={runSync}
          refreshTrigger={whatsappRefreshTrigger}
          onOpenReschedule={(app) => {
            setRescheduleAppointment(app);
          }}
        />
      </div>


      {/* Gaveta de Criação Rápida */}
      <QuickAppointmentDrawer
        isOpen={isQuickOpen}
        onClose={() => {
          setIsQuickOpen(false);
          setQuickPatient(null);
        }}
        tenantId={tenantId}
        initialDate={currentDate}
        initialTimeStr={quickSlotTime}
        initialPatient={quickPatient}
        existingAppointments={detailedAppointments}
        appointmentRepo={appointmentRepo}
        patientRepo={patientRepo}
        procedureRepo={procedureRepo}
        onAppointmentCreated={(created) => {
          if (created?.start_time) {
            setCurrentDate(new Date(created.start_time));
          }
          setIsQuickOpen(false);
          setQuickPatient(null);
        }}
      />

      {/* Gaveta de Detalhes do Agendamento */}
      <AppointmentDetailsDrawer
        isOpen={Boolean(selectedAppointment)}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointmentRepo={appointmentRepo}
        procedureRepo={procedureRepo}
        financialRepo={financialRepo}
        tenantId={tenantId}
        onStatusChanged={(updated) => {
          setSelectedAppointment(null);
        }}
        onOpenReschedule={(app) => {
          setSelectedAppointment(null);
          setRescheduleAppointment(app);
        }}
        onOpenCheckout={(app) => {
          setSelectedAppointment(null);
          setCheckoutAppointment(app);
        }}
      />

      {/* Modal de Remarcação */}
      <RescheduleModal
        isOpen={Boolean(rescheduleAppointment)}
        appointment={rescheduleAppointment}
        existingAppointments={detailedAppointments}
        onClose={() => setRescheduleAppointment(null)}
        onRescheduled={async (updated) => {
          if (updated?.start_time) {
            setCurrentDate(new Date(updated.start_time));
          }
          setRescheduleAppointment(null);
          await runSync();
          setWhatsappRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Gaveta de Checkout Financeiro */}
      {checkoutAppointment && (
        <CheckoutDrawer
          isOpen={Boolean(checkoutAppointment)}
          appointment={checkoutAppointment}
          onClose={() => setCheckoutAppointment(null)}
          onCompleteCheckout={handleCompleteCheckout}
          onOpenReturnDrawer={() => {
            if (checkoutAppointment) {
              setSmartReturnData({
                patientId: checkoutAppointment.patient_id,
                patientName: checkoutAppointment.patient_name,
                baseDate: new Date(checkoutAppointment.start_time),
                preferredTimeStr: '09:00',
              });
            }
          }}
        />
      )}

      {/* Gaveta de Retorno Inteligente */}
      {smartReturnData && (
        <SmartReturnDrawer
          isOpen={Boolean(smartReturnData)}
          onClose={() => setSmartReturnData(null)}
          tenantId={tenantId}
          patientId={smartReturnData.patientId}
          patientName={smartReturnData.patientName}
          baseDate={smartReturnData.baseDate}
          preferredTimeStr={smartReturnData.preferredTimeStr}
          existingAppointments={detailedAppointments}
          appointmentRepo={appointmentRepo}
          onReturnScheduled={() => setSmartReturnData(null)}
        />
      )}

      {/* Modal de Despesa Rápida */}
      <QuickExpenseModal
        isOpen={isExpenseModalOpen}
        tenantId={tenantId}
        onClose={() => setIsExpenseModalOpen(false)}
        financialRepo={financialRepo}
        onExpenseSaved={() => setIsExpenseModalOpen(false)}
      />

      {/* Modal de Cadastro / Edição de Paciente */}
      <CreatePatientModal
        isOpen={isCreatePatientOpen}
        tenantId={tenantId}
        patientRepo={patientRepo}
        patientToEdit={editingPatient}
        onClose={() => {
          setIsCreatePatientOpen(false);
          setEditingPatient(null);
        }}
        onPatientSaved={() => {
          setIsCreatePatientOpen(false);
          setEditingPatient(null);
        }}
        onPatientCreated={() => {
          setIsCreatePatientOpen(false);
          setEditingPatient(null);
        }}
        onDeletePatient={(patient) => {
          setPatientToDelete(patient);
          setIsDeletePatientOpen(true);
        }}
      />

      {/* Modal de Confirmação de Exclusão de Paciente */}
      <ConfirmDeletePatientModal
        isOpen={isDeletePatientOpen}
        patient={patientToDelete}
        onClose={() => {
          setIsDeletePatientOpen(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleConfirmDeletePatient}
      />

      {/* Modal de Cadastro / Edição de Procedimento */}
      <ProcedureFormModal
        isOpen={isProcedureModalOpen}
        onClose={() => {
          setIsProcedureModalOpen(false);
          setEditingProcedure(null);
        }}
        tenantId={tenantId}
        procedureRepo={procedureRepo}
        procedureToEdit={editingProcedure}
        onProcedureSaved={() => {
          setIsProcedureModalOpen(false);
          setEditingProcedure(null);
        }}
      />

      {/* Modal de Confirmação de Exclusão de Procedimento */}
      <ConfirmDeleteProcedureModal
        isOpen={isDeleteProcedureOpen}
        procedure={procedureToDelete}
        onClose={() => {
          setIsDeleteProcedureOpen(false);
          setProcedureToDelete(null);
        }}
        onConfirm={handleConfirmDeleteProcedure}
      />

      {/* Gaveta de Confirmação de Logout */}
      <LogoutConfirmDrawer
        isOpen={isLogoutDrawerOpen}
        pendingCount={pendingOutboxCount}
        onConfirmLogout={handleConfirmLogout}
        onClose={() => setIsLogoutDrawerOpen(false)}
      />

      {/* Gaveta de Prontuário Financeiro do Paciente */}
      <PatientFinancialDrawer
        isOpen={Boolean(patientForFinancial)}
        patient={patientForFinancial}
        appointments={appointments}
        transactions={transactions}
        procedures={procedures}
        financialRepo={financialRepo}
        onClose={() => setPatientForFinancial(null)}
      />
    </AppShell>
  );
};

export const AuthenticatedApp: React.FC = () => {
  const { session, apiClient, logout } = useAuth();
  return (
    <App
      session={session}
      apiClient={apiClient}
      onLogout={logout}
      tenantId={session?.tenant?.id}
    />
  );
};

export default App;
