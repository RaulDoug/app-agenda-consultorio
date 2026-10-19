import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppShell } from './components/layout/AppShell.js';
import { type NavTabId } from './components/layout/BottomNav.js';
import { CliniAssistLocalDB, localDb } from './db/local-db.js';
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

import { PatientList } from './features/patients/components/PatientList.js';

import { CashFlowDashboard } from './features/analytics/components/CashFlowDashboard.js';
import { InactivePatientsList } from './features/analytics/components/InactivePatientsList.js';
import { QuickExpenseModal } from './features/checkout/components/QuickExpenseModal.js';
import { CheckoutDrawer, type CheckoutResult } from './features/checkout/components/CheckoutDrawer.js';
import { InstallmentsForm } from './features/checkout/components/InstallmentsForm.js';
import { SmartReturnDrawer } from './features/checkout/components/SmartReturnDrawer.js';

import { SettingsView } from './features/settings/components/SettingsView.js';
import { SyncManager } from './sync/sync-manager.js';
import { Plus } from 'lucide-react';

export interface AppProps {
  initialTab?: NavTabId;
  db?: CliniAssistLocalDB;
  tenantId?: string;
  initialWhatsappConnected?: boolean;
}

export const App: React.FC<AppProps> = ({
  initialTab = 'agenda',
  db = localDb,
  tenantId = '11111111-1111-1111-1111-111111111111',
  initialWhatsappConnected = true,
}) => {
  const [activeTab, setActiveTab] = useState<NavTabId>(initialTab);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean>(initialWhatsappConnected);
  const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null);

  // Efeito de busca do status da sessão WhatsApp e polling quando desconectado
  const fetchWhatsappSession = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/session', {
        headers: { 'x-tenant-id': tenantId },
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
  }, [tenantId]);

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
    () => new SyncManager({ tenantId, db }),
    [tenantId, db]
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
        headers: { 'x-tenant-id': tenantId },
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
        headers: { 'x-tenant-id': tenantId },
      });
    } catch {
      // Fallback
    }
    setWhatsappConnected(false);
    await fetchWhatsappSession();
  };

  // Repositórios com banco injetado
  const appointmentRepo = useMemo(() => new AppointmentLocalRepository(db), [db]);
  const patientRepo = useMemo(() => new PatientLocalRepository(db), [db]);
  const procedureRepo = useMemo(() => new ProcedureLocalRepository(db), [db]);
  const financialRepo = useMemo(() => new FinancialLocalRepository(db), [db]);
  const settingsRepo = useMemo(() => new SettingsLocalRepository(db), [db]);

  // Status de conexão
  const { connectionStatus } = useConnectionStatus();

  // Dados reativos do Dexie
  const patients = useLiveQuery(() => db.patients.toArray(), [db]) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray(), [db]) || [];
  const procedures = useLiveQuery(() => db.procedures.toArray(), [db]) || [];
  const appointmentItems = useLiveQuery(() => db.appointment_items.toArray(), [db]) || [];
  const transactions = useLiveQuery(() => db.financial_transactions.toArray(), [db]) || [];

  // Estado da Agenda
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  // Modais e Drawers da Agenda
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [quickSlotTime, setQuickSlotTime] = useState('08:00');
  const [selectedAppointment, setSelectedAppointment] = useState<LocalAppointmentWithDetails | null>(null);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<LocalAppointmentWithDetails | null>(null);

  // Modais de Caixa / Checkout / Retorno
  const [checkoutAppointment, setCheckoutAppointment] = useState<LocalAppointmentWithDetails | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [smartReturnData, setSmartReturnData] = useState<{
    patientId: string;
    patientName: string;
    baseDate: Date;
    preferredTimeStr: string;
  } | null>(null);

  // Agendamentos enriquecidos para exibição na grade
  const detailedAppointments: LocalAppointmentWithDetails[] = useMemo(() => {
    const patientMap = new Map(patients.map((p) => [p.id, p]));
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
  }, [appointments, patients, procedures, appointmentItems]);

  // Manipuladores de Slot e Agendamento
  const handleSlotClick = (date: Date, timeStr: string) => {
    setCurrentDate(date);
    setQuickSlotTime(timeStr);
    setIsQuickOpen(true);
  };

  const handlePrevDate = () => {
    setCurrentDate((prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const handleNextDate = () => {
    setCurrentDate((prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Concluir Checkout e gerar transações
  const handleCompleteCheckout = async (result: CheckoutResult) => {
    if (result.paymentMethod === 'PARCELADO') {
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
            description: 'Entrada Checkout',
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
            description: `Parcela ${i}/${count}`,
          });
        }
      }

      await financialRepo.recordCheckout({
        tenantId,
        appointmentId: result.appointmentId,
        totalCents: result.totalCents,
        paymentMethod: 'PARCELADO',
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
            description: 'Atendimento Concluído',
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
      connectionStatus={connectionStatus}
      whatsappConnected={whatsappConnected}
    >
      {/* ABA 1: AGENDA */}
      {activeTab === 'agenda' && (
        <div data-testid="agenda-tab-content" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Agenda de Atendimentos</h2>
              <p className="text-xs text-slate-500">Visualização diária, semanal e mensal com agendamento rápido.</p>
            </div>
            <button
              type="button"
              data-testid="btn-new-appointment-top"
              onClick={() => {
                setQuickSlotTime('08:00');
                setIsQuickOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              + Novo Agendamento
            </button>
          </div>

          <ViewModeSelector
            currentDate={currentDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onPrevDate={handlePrevDate}
            onNextDate={handleNextDate}
            onToday={handleToday}
          />

          <ScheduleGrid
            currentDate={currentDate}
            viewMode={viewMode}
            appointments={detailedAppointments}
            onSlotClick={handleSlotClick}
            onAppointmentClick={(app) => setSelectedAppointment(app)}
            onMarkNoShow={(appId) => appointmentRepo.updateStatus(appId, 'NO_SHOW')}
            onReschedule={(app) => setRescheduleAppointment(app)}
          />
        </div>
      )}

      {/* ABA 2: CLIENTES */}
      {activeTab === 'clientes' && (
        <div data-testid="clientes-tab-content" className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Clientes & Pacientes</h2>
            <p className="text-xs text-slate-500">Base integrada com histórico de atendimentos e atalhos rápidos.</p>
          </div>

          <PatientList
            tenantId={tenantId}
            patients={patients}
            appointments={appointments}
            onSchedule={(pw) => {
              setActiveTab('agenda');
              setQuickSlotTime('09:00');
              setIsQuickOpen(true);
            }}
          />
        </div>
      )}

      {/* ABA 3: CAIXA & FINANCEIRO */}
      {activeTab === 'caixa' && (
        <div data-testid="caixa-tab-content" className="space-y-6">
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
          />

          <InactivePatientsList
            patients={patients}
            appointments={appointments}
          />
        </div>
      )}

      {/* ABA 4: AJUSTES */}
      {activeTab === 'ajustes' && (
        <div data-testid="ajustes-tab-content">
          <SettingsView
            tenantId={tenantId}
            repo={settingsRepo}
            whatsappConnected={whatsappConnected}
            qrCodeBase64={whatsappQrCode}
            connectedNumber={connectedNumber}
            onRefreshWhatsApp={handleRefreshWhatsapp}
            onDisconnectWhatsApp={handleDisconnectWhatsapp}
          />
        </div>
      )}

      {/* Gaveta de Criação Rápida */}
      <QuickAppointmentDrawer
        isOpen={isQuickOpen}
        onClose={() => setIsQuickOpen(false)}
        tenantId={tenantId}
        initialDate={currentDate}
        initialTimeStr={quickSlotTime}
        existingAppointments={detailedAppointments}
        appointmentRepo={appointmentRepo}
        patientRepo={patientRepo}
        procedureRepo={procedureRepo}
        onAppointmentCreated={() => setIsQuickOpen(false)}
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
        onClose={() => setRescheduleAppointment(null)}
        onRescheduled={(updated) => {
          if (updated?.start_time) {
            setCurrentDate(new Date(updated.start_time));
          }
          setRescheduleAppointment(null);
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
    </AppShell>
  );
};

export default App;
