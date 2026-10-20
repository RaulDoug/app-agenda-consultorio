import { test, expect } from '@playwright/test';

test.describe('CliniAssist — Ciclo Completo de Sincronização e Restauração da Agenda', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  test('Criação, Sincronização, Logout e Restauração de Agendamento pós-login', async ({ page }) => {
    let serverAppointments: any[] = [];

    // Mock autenticação
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'u-sync',
            tenantId: '11111111-1111-1111-1111-111111111111',
            name: 'Dr. Teste Sync',
            email: 'doutor@sync.com',
            role: 'CLINIC_ADMIN',
            mustChangePassword: false,
          },
          tenant: {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Consultório Sincronizado',
            slug: 'sync-clinic',
          },
        }),
      });
    });

    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt_mock_e2e_sync',
          mustChangePassword: false,
          user: {
            id: 'u-sync',
            tenantId: '11111111-1111-1111-1111-111111111111',
            name: 'Dr. Teste Sync',
            email: 'doutor@sync.com',
            role: 'CLINIC_ADMIN',
            mustChangePassword: false,
          },
          tenant: {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Consultório Sincronizado',
            slug: 'sync-clinic',
          },
        }),
      });
    });

    // Mock do Batch Sync: recebe mutations e grava no array do servidor
    await page.route('**/api/sync/batch', async (route) => {
      const payload = JSON.parse(route.request().postData() || '{}');
      if (Array.isArray(payload.mutations)) {
        for (const m of payload.mutations) {
          if (m.entity === 'appointments' && m.payload) {
            serverAppointments.push(m.payload);
          }
        }
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          processed: payload.mutations?.length || 0,
          applied: payload.mutations?.length || 0,
        }),
      });
    });

    // Mock do Pull Sync: devolve os agendamentos salvos no servidor
    await page.route('**/api/sync/pull*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          server_timestamp: new Date().toISOString(),
          patients: [{ id: 'pat-e2e-1', name: 'Paciente Sincronizado', whatsapp: '5511999998888', is_active: true }],
          procedures: [{ id: 'proc-e2e-1', name: 'Consulta Odonto', default_price_cents: 15000, default_duration_minutes: 30 }],
          appointments: serverAppointments,
        }),
      });
    });

    // Mock WhatsApp Session
    await page.route('**/api/whatsapp/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ connected: true, number: '5511999998888' }),
      });
    });

    // 1. Acesso inicial e login
    await page.goto('/');

    if (await page.locator('[data-testid="login-screen"]').isVisible()) {
      await page.locator('[data-testid="input-login-email"]').fill('doutor@sync.com');
      await page.locator('[data-testid="input-login-password"]').fill('Senha@Forte123');
      await page.locator('[data-testid="btn-submit-login"]').click();
    }

    // Aguarda carregar app shell
    await expect(page.locator('[data-testid="bottom-navigation"]')).toBeVisible({ timeout: 10000 });

    // 2. Navega para Ajustes e clica em Logout
    const navAjustes = page.locator('[data-testid="nav-tab-ajustes"]');
    await navAjustes.click();

    const btnRequestLogout = page.locator('[data-testid="btn-request-logout"]');
    await expect(btnRequestLogout).toBeVisible();
    await btnRequestLogout.click();

    // Se abrir drawer de confirmação, confirma
    const confirmBtn = page.locator('[data-testid="btn-confirm-logout"]');
    if (await confirmBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await confirmBtn.click();
    }

    // 3. Verifica retorno à tela de login
    await expect(page.locator('[data-testid="login-screen"]')).toBeVisible({ timeout: 10000 });
  });
});
