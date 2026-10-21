# Graph Report - App-Agenda-Consultório  (2026-10-21)

## Corpus Check
- Large corpus: 510 files · ~319,973 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 1544 nodes · 4529 edges · 54 communities (47 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 225 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Local Auth & Session Management
- Financial & Transactions Backend
- Reports & Management Analytics
- Appointments Controller & Backend
- Business Hours & Schedule Blocks
- Local Appointments & Procedures Repos
- User Management & CLI Scripts
- Spec-Driven CLI & Lifecycle
- Express App & Auth Middlewares
- Outbox Sync & Local Mutation Queue
- Backend Tests & Database Connection
- Spec-Driven Audit & Compliance
- Backend Dependencies & Package Config
- Frontend App Root & Patient Repos
- WhatsApp Scheduler & Notification Jobs
- Event Ledger & Spec Signals
- Local Financial Repository & Outbox
- Monorepo Root Dependencies & Build
- Spec-Driven Planning & Tasks
- Local Settings & Business Hours Repo
- Patient Management & Controller
- Frontend AppShell & Navigation Layout
- WhatsApp Evolution Client & Messaging
- Financial Categories Controller
- Procedure Management Controller
- WhatsApp Connection Controller
- Dexie IndexedDB Local Database
- Database Abstraction & Analytics Repo
- Checkout Drawer & Financial UI
- Authentication Controller & Identity
- Webhook Parser & Message Classification
- Shared Package Configuration
- WhatsApp Repository & Templates
- WhatsApp Webhook Controller
- Frontend Testing & Tooling Dependencies
- Base TypeScript Configuration
- Backend TypeScript Configuration
- Frontend TypeScript Configuration
- Spec-Driven Signals & Telemetry
- Mock Evolution API Client
- Frontend Core Dependencies & UI Libs
- PWA Web App Manifest
- Backend Package Scripts & Config
- Spec-Driven Scaffold Generator
- Spec-Driven Verification Engine
- BullMQ WhatsApp Confirmation Queue
- Frontend Build Scripts & Tasks
- Shared TypeScript Configuration
- Smart Return Date Engine
- Playwright E2E Test Suite
- Vite & Vitest Frontend Config
- Backend Vitest Configuration

## God Nodes (most connected - your core abstractions)
1. `IDatabase` - 88 edges
2. `react` - 72 edges
3. `CliniAssistLocalDB` - 57 edges
4. `express` - 55 edges
5. `LocalPatient` - 42 edges
6. `App()` - 36 edges
7. `createInMemoryDatabase()` - 35 edges
8. `getDatabase()` - 34 edges
9. `WhatsappRepository` - 33 edges
10. `FinancialLocalRepository` - 33 edges

## Surprising Connections (you probably didn't know these)
- `StatusTransitionResult` --references--> `AppointmentStatus`  [EXTRACTED]
  backend/src/whatsapp/parser.ts → shared/src/types/appointment.ts
- `CheckoutParams` --references--> `DiscountOptions`  [EXTRACTED]
  backend/src/repositories/financial-repository.ts → shared/src/financial/calculator.ts
- `CheckoutParams` --references--> `ProcedurePricingItem`  [EXTRACTED]
  backend/src/repositories/financial-repository.ts → shared/src/financial/calculator.ts
- `ReceivablesStatsRaw` --references--> `ReceivablesBreakdown`  [EXTRACTED]
  backend/src/repositories/reports-repository.ts → shared/src/types/report.ts
- `LocalAuthSession` --references--> `AuthTenantProfile`  [EXTRACTED]
  frontend/src/db/types.ts → shared/src/types/auth.ts

## Import Cycles
- None detected.

## Communities (54 total, 7 thin omitted)

### Community 0 - "Local Auth & Session Management"
Cohesion: 0.06
Nodes (37): AppProps, AuthSessionLocalRepository, LocalAuthSession, AuthGate(), AuthGateProps, ChangePasswordScreen(), ChangePasswordScreenProps, LoginScreen() (+29 more)

### Community 1 - "Financial & Transactions Backend"
Cohesion: 0.05
Nodes (29): FinancialController, IDatabaseClient, PostgresPoolAdapter, CheckoutParams, CreateFinancialTransactionDTO, FinancialMetricsResult, FinancialRepository, FinancialTransaction (+21 more)

### Community 2 - "Reports & Management Analytics"
Cohesion: 0.06
Nodes (23): ReportsController, AnalyticsRepository, DREStatsRaw, NoShowStatsRaw, ReceivablesStatsRaw, ReportsRepository, ReportsService, reportsApiClient (+15 more)

### Community 3 - "Appointments Controller & Backend"
Cohesion: 0.06
Nodes (17): AppointmentController, ScheduleBlockController, AppointmentRepository, DoubleBookingConflictError, PreparedAppointmentItem, CreateScheduleBlockDTO, UpdateScheduleBlockDTO, AppointmentConflictError (+9 more)

### Community 4 - "Business Hours & Schedule Blocks"
Cohesion: 0.06
Nodes (34): BusinessHoursController, ALLOWED_TRANSITIONS, assertValidStatusTransition(), canTransitionAppointmentStatus(), StatusTransitionResult, TERMINAL_STATUSES, calculateAppointmentDuration(), CalculatedAppointmentTime (+26 more)

### Community 5 - "Local Appointments & Procedures Repos"
Cohesion: 0.12
Nodes (36): appointmentLocalRepo, AppointmentLocalRepository, CreateAppointmentItemInput, CreateProcedureInput, DEFAULT_PROCEDURES_SEEDS, procedureLocalRepo, ProcedureLocalRepository, LocalProcedure (+28 more)

### Community 6 - "User Management & CLI Scripts"
Cohesion: 0.08
Nodes (27): parseArgs(), run(), parseArgs(), run(), DEFAULT_JWT_SECRET, CreateTenantData, TenantRecord, TenantRepository (+19 more)

### Community 7 - "Spec-Driven CLI & Lifecycle"
Cohesion: 0.09
Nodes (47): cmdAssumptions(), cmdInit(), cmdLicoes(), cmdNew(), cmdStatus(), cmdStreamResumo(), copyDirIfExists(), detectarAgente() (+39 more)

### Community 8 - "Express App & Auth Middlewares"
Cohesion: 0.07
Nodes (35): app, authAllowPasswordChange(), authenticateRequest(), authMiddleware(), Express, getJwtSecret(), Request, TokenPayload (+27 more)

### Community 9 - "Outbox Sync & Local Mutation Queue"
Cohesion: 0.09
Nodes (32): EnqueueMutationParams, CreateAppointmentInput, AppointmentStatus, LocalAppointment, LocalAppointmentItem, OutboxEntity, OutboxOperation, OutboxStatus (+24 more)

### Community 10 - "Backend Tests & Database Connection"
Cohesion: 0.21
Nodes (13): createApp(), createInMemoryDatabase(), __dirname, __filename, QueryResult, setDatabase(), generateTestToken(), seedTestTenant() (+5 more)

### Community 11 - "Spec-Driven Audit & Compliance"
Cohesion: 0.09
Nodes (34): auditProject(), CI_ESCALATES, finding(), latestMtime(), loadProject(), grepPattern(), scanAnnotations(), staticDirOf() (+26 more)

### Community 12 - "Backend Dependencies & Package Config"
Cohesion: 0.05
Nodes (42): dependencies, bcrypt, bullmq, @cliniassist/shared, express, ioredis, jsonwebtoken, pg (+34 more)

### Community 13 - "Frontend App Root & Patient Repos"
Cohesion: 0.14
Nodes (23): App(), MoreMenuHub(), CreatePatientInput, patientLocalRepo, PatientLocalRepository, LocalPatient, InlinePatientFormProps, ViewModeSelector() (+15 more)

### Community 14 - "WhatsApp Scheduler & Notification Jobs"
Cohesion: 0.08
Nodes (16): ScheduleBatchOptions, WhatsappSchedulerService, ConfirmationJobData, EnqueuedJobRecord, getConfirmationQueue(), IConfirmationQueue, InMemoryConfirmationQueue, AppointmentConfirmationCandidate (+8 more)

### Community 15 - "Event Ledger & Spec Signals"
Cohesion: 0.12
Nodes (32): cmdEvento(), cmdResumo(), caminhos(), caminhoStream(), corta(), ESTADOS_FAIXA, homeOnp(), lerEventos() (+24 more)

### Community 16 - "Local Financial Repository & Outbox"
Cohesion: 0.12
Nodes (18): enqueueMutation(), financialLocalRepo, FinancialLocalRepository, RecordCheckoutInput, RecordExpenseInput, LocalFinancialTransaction, CashFlowDashboardProps, FinancialLedger() (+10 more)

### Community 17 - "Monorepo Root Dependencies & Build"
Cohesion: 0.06
Nodes (35): description, devDependencies, concurrently, @types/node, typescript, vitest, engines, node (+27 more)

### Community 18 - "Spec-Driven Planning & Tasks"
Cohesion: 0.13
Nodes (30): cmdPlano(), cmdTarefa(), definirCampoTarefa(), gerarArtefatosPlano(), AGENTES, allowedTools(), descreveTarefa(), ehModeloClaude() (+22 more)

### Community 19 - "Local Settings & Business Hours Repo"
Cohesion: 0.15
Nodes (18): BusinessHoursInput, CreateScheduleBlockInput, DEFAULT_BUSINESS_HOURS(), SettingsLocalRepository, settingsRepo, LocalBusinessHours, LocalScheduleBlock, WhatsAppPairingView() (+10 more)

### Community 20 - "Patient Management & Controller"
Cohesion: 0.15
Nodes (6): PatientController, PatientRepository, PatientService, CreatePatientDTO, Patient, UpdatePatientDTO

### Community 21 - "Frontend AppShell & Navigation Layout"
Cohesion: 0.12
Nodes (22): AppShell(), AppShellProps, BottomNav(), BottomNavProps, DESKTOP_NAV_ITEMS, MOBILE_NAV_ITEMS_LEFT, MOBILE_NAV_ITEMS_RIGHT, NavItem (+14 more)

### Community 22 - "WhatsApp Evolution Client & Messaging"
Cohesion: 0.14
Nodes (12): run(), BULLMQ_RETRY_BACKOFF_CONFIG, EvolutionError, EvolutionHttpClient, EvolutionTransientError, getEvolutionClient(), InstanceConnectionState, QrCodeResponse (+4 more)

### Community 23 - "Financial Categories Controller"
Cohesion: 0.16
Nodes (6): FinancialCategoryController, DEFAULT_FINANCIAL_CATEGORIES, FinancialCategoryRepository, FinancialCategoryService, CreateFinancialCategoryDTO, FinancialCategory

### Community 24 - "Procedure Management Controller"
Cohesion: 0.15
Nodes (6): ProcedureController, ProcedureRepository, ProcedureService, CreateProcedureDTO, Procedure, UpdateProcedureDTO

### Community 25 - "WhatsApp Connection Controller"
Cohesion: 0.12
Nodes (5): WhatsappController, SendManualMessageInput, SessionStatusResponse, WhatsappService, IEvolutionClient

### Community 26 - "Dexie IndexedDB Local Database"
Cohesion: 0.14
Nodes (11): CliniAssistLocalDB, localDb, SyncMetadata, SyncOutboxItem, pruneOldCompletedAppointments(), PruneResult, SyncManager, SyncManagerConfig (+3 more)

### Community 27 - "Database Abstraction & Analytics Repo"
Cohesion: 0.14
Nodes (8): getDatabase(), IDatabase, CashFlowProjection, DREMetrics, InactivePatientItem, NoShowMetrics, ProcedureProfitabilityRankingItem, ScheduleBlockRepository

### Community 28 - "Checkout Drawer & Financial UI"
Cohesion: 0.19
Nodes (17): InstallmentPlanItem, CheckoutDrawer(), CheckoutDrawerProps, CheckoutResult, PaymentMethod, InstallmentsForm(), InstallmentsFormProps, ItemPriceEditor() (+9 more)

### Community 29 - "Authentication Controller & Identity"
Cohesion: 0.19
Nodes (14): AuthController, attemptsStore, BLOCK_DURATION_MS, buildRateLimitKey(), getClientIp(), isRateLimited(), loginRateLimiter(), MAX_LOGIN_ATTEMPTS (+6 more)

### Community 30 - "Webhook Parser & Message Classification"
Cohesion: 0.14
Nodes (15): CONFIRMATION_PATTERNS, MediaResponseHook, ParsedMessageClassification, ParseMessageInput, ParseResult, RESCHEDULE_PATTERNS, resolveStatusTransition(), StatusTransitionResult (+7 more)

### Community 31 - "Shared Package Configuration"
Cohesion: 0.10
Nodes (20): description, @cliniassist/shared, typescript, vitest, name, private, type, version (+12 more)

### Community 32 - "WhatsApp Repository & Templates"
Cohesion: 0.17
Nodes (7): DEFAULT_WHATSAPP_TEMPLATES, CreateWhatsappMessageInput, TenantWhatsappSettings, UpdateTenantWhatsappSettingsInput, WhatsappMessageDirection, WhatsappMessageRecord, WhatsappMessageStatus

### Community 33 - "WhatsApp Webhook Controller"
Cohesion: 0.18
Nodes (4): WebhookController, WhatsappRepository, WebhookService, parsePatientMessage()

### Community 34 - "Frontend Testing & Tooling Dependencies"
Cohesion: 0.12
Nodes (17): devDependencies, autoprefixer, fake-indexeddb, jsdom, msw, @playwright/test, postcss, tailwindcss (+9 more)

### Community 35 - "Base TypeScript Configuration"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, paths, resolveJsonModule, skipLibCheck (+3 more)

### Community 36 - "Backend TypeScript Configuration"
Cohesion: 0.18
Nodes (10): compilerOptions, module, moduleResolution, outDir, paths, rootDir, extends, include (+2 more)

### Community 37 - "Frontend TypeScript Configuration"
Cohesion: 0.18
Nodes (10): compilerOptions, jsx, lib, noEmit, paths, types, extends, include (+2 more)

### Community 38 - "Spec-Driven Signals & Telemetry"
Cohesion: 0.44
Nodes (9): agora(), caminhoSinais(), carregarSinais(), compactar(), refDoAchado(), registrar(), registrarAchados(), registrarVerify() (+1 more)

### Community 40 - "Frontend Core Dependencies & UI Libs"
Cohesion: 0.20
Nodes (10): dependencies, @cliniassist/shared, clsx, date-fns, dexie, dexie-react-hooks, lucide-react, react (+2 more)

### Community 41 - "PWA Web App Manifest"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 42 - "Backend Package Scripts & Config"
Cohesion: 0.20
Nodes (9): description, main, name, private, scripts, test, type, types (+1 more)

### Community 43 - "Spec-Driven Scaffold Generator"
Cohesion: 0.44
Nodes (8): detectStyle(), jsFail(), jsHeader(), renderJsPrinciple(), renderJsTest(), renderPyPrinciple(), renderPyTest(), scaffoldTests()

### Community 44 - "Spec-Driven Verification Engine"
Cohesion: 0.36
Nodes (7): extractTags(), gitRev(), parseJsonReport(), parseTap(), resultsByTag(), runVerify(), STATUS_RANK

### Community 46 - "Frontend Build Scripts & Tasks"
Cohesion: 0.29
Nodes (7): scripts, build, dev, preview, test, test:e2e, test:watch

### Community 47 - "Shared TypeScript Configuration"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../tsconfig.base.json

### Community 48 - "Smart Return Date Engine"
Cohesion: 0.40
Nodes (5): calculateTargetReturnDate(), evaluateSmartReturn(), ReturnPeriod, SmartReturnCalculation, SmartReturnSlotOption

## Knowledge Gaps
- **28 isolated node(s):** `@cliniassist/shared`, `ioredis`, `@types/bcrypt`, `@types/express`, `@types/jsonwebtoken` (+23 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 390 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `IDatabase` connect `Database Abstraction & Analytics Repo` to `WhatsApp Repository & Templates`, `Financial & Transactions Backend`, `Reports & Management Analytics`, `Appointments Controller & Backend`, `Business Hours & Schedule Blocks`, `WhatsApp Webhook Controller`, `User Management & CLI Scripts`, `Express App & Auth Middlewares`, `Backend Tests & Database Connection`, `Patient Management & Controller`, `Financial Categories Controller`, `Procedure Management Controller`, `Authentication Controller & Identity`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `@cliniassist/shared`, `ioredis`, `@types/bcrypt` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Local Auth & Session Management` be split into smaller, more focused modules?**
  _Cohesion score 0.05877167205406994 - nodes in this community are weakly interconnected._
- **Why does `express` connect `Backend Tests & Database Connection` to `Financial & Transactions Backend`, `Reports & Management Analytics`, `Appointments Controller & Backend`, `Business Hours & Schedule Blocks`, `WhatsApp Webhook Controller`, `User Management & CLI Scripts`, `Express App & Auth Middlewares`, `Backend Dependencies & Package Config`, `Patient Management & Controller`, `Financial Categories Controller`, `Procedure Management Controller`, `WhatsApp Connection Controller`, `Authentication Controller & Identity`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `Financial & Transactions Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.05017543859649123 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Local Settings & Business Hours Repo` to `Local Auth & Session Management`, `Local Appointments & Procedures Repos`, `Outbox Sync & Local Mutation Queue`, `Frontend App Root & Patient Repos`, `Local Financial Repository & Outbox`, `Frontend AppShell & Navigation Layout`, `Dexie IndexedDB Local Database`, `Checkout Drawer & Financial UI`, `Shared Package Configuration`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Should `Reports & Management Analytics` be split into smaller, more focused modules?**
  _Cohesion score 0.06317907444668008 - nodes in this community are weakly interconnected._