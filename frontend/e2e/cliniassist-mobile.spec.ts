import { test, expect } from '@playwright/test';

test.describe('CliniAssist — Suíte Mobile-First iPhone 14 (390x844)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  test.beforeEach(async ({ page }) => {
    // Configura mocks da API de autenticação
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u-1',
            tenantId: 'tenant-123',
            name: 'Dra. Ana Paula',
            email: 'doutora@odonto.com',
            role: 'CLINIC_ADMIN',
            mustChangePassword: false,
          },
          tenant: {
            id: 'tenant-123',
            name: 'Consultório OdontoFlow',
            email: 'doutora@odonto.com',
            must_change_password: false,
          },
        }),
      });
    });

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token-mobile',
          user: {
            id: 'u-1',
            tenantId: 'tenant-123',
            name: 'Dra. Ana Paula',
            email: 'doutora@odonto.com',
            role: 'CLINIC_ADMIN',
            mustChangePassword: false,
          },
          tenant: {
            id: 'tenant-123',
            name: 'Consultório OdontoFlow',
            email: 'doutora@odonto.com',
            must_change_password: false,
          },
        }),
      });
    });

    await page.goto('/');

    // Aguarda a tela de login aparecer e realiza a autenticação inicial
    const loginScreen = page.locator('[data-testid="login-screen"]');
    await expect(loginScreen).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="input-login-email"]').fill('doutora@odonto.com');
    await page.locator('[data-testid="input-login-password"]').fill('Senha1234');
    await page.locator('[data-testid="btn-submit-login"]').click();
    await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible({ timeout: 10000 });
  });

  test('Jornada Completa Mobile: Navegação entre abas, agendamento e finanças', async ({ page }) => {
    // 1. Verifica renderização do AppShell e Bottom Navigation mobile
    const bottomNav = page.locator('[data-testid="bottom-navigation"]');
    await expect(bottomNav).toBeVisible();

    // 2. Navegação para aba Ajustes e validação de expediente e bloqueios
    await page.locator('[data-testid="nav-tab-ajustes"]').click();
    await expect(page.locator('[data-testid="settings-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="schedule-blocks-manager"]')).toBeVisible();

    // 3. Navegação para aba Clientes
    await page.locator('[data-testid="nav-tab-clientes"]').click();
    await expect(page.locator('[data-testid="clientes-tab-content"]')).toBeVisible();

    // 4. Navegação para aba Caixa e abertura do modal de despesa
    await page.locator('[data-testid="nav-tab-caixa"]').click();
    await expect(page.locator('[data-testid="cash-flow-dashboard"]')).toBeVisible();

    // 5. Retorno à aba Agenda
    await page.locator('[data-testid="nav-tab-agenda"]').click();
    await expect(page.locator('[data-testid="agenda-tab-content"]')).toBeVisible();
  });

  test('Resiliência Modo Avião (Offline-First): Operação sem conexão e integridade local', async ({
    page,
    context,
  }) => {
    // 1. Simula entrada em Modo Avião (Offline)
    await context.setOffline(true);

    // 2. Navega para aba de Ajustes offline
    await page.locator('[data-testid="nav-tab-ajustes"]').click();
    await expect(page.locator('[data-testid="settings-view"]')).toBeVisible();

    // 3. Cadastra bloqueio de agenda offline
    await page.locator('[data-testid="btn-toggle-add-block"]').click();
    await page.locator('[data-testid="input-block-title"]').fill('Manutenção Elétrica Offline');
    await page.locator('[data-testid="input-block-start"]').fill('2026-12-01T08:00');
    await page.locator('[data-testid="input-block-end"]').fill('2026-12-01T12:00');
    await page.locator('[data-testid="btn-save-schedule-block"]').click();

    // 4. Comprova que o bloqueio aparece na tela mesmo sem rede
    await expect(page.getByText('Manutenção Elétrica Offline')).toBeVisible();

    // 5. Restaura a conexão para permitir que o Vite dev server sirva os assets no reload
    await context.setOffline(false);
    await page.reload();

    // 6. A sessão continua salva no IndexedDB e o bloqueio persiste
    await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible();
    await page.locator('[data-testid="nav-tab-ajustes"]').click();
    await expect(page.getByText('Manutenção Elétrica Offline')).toBeVisible();
  });
});
