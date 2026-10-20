import { test, expect } from '@playwright/test';

test.describe('CliniAssist — Fluxo de Autenticação e Gestão de Sessão', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  test.beforeEach(async ({ page }) => {
    // Mock default da API de autenticação
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
            slug: 'odontoflow',
          },
        }),
      });
    });
  });

  test('Exibe a tela de login como porta de entrada quando não há sessão ativa', async ({ page }) => {
    await page.goto('/');

    const loginScreen = page.locator('[data-testid="login-screen"]');
    await expect(loginScreen).toBeVisible();

    await expect(page.locator('[data-testid="input-login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-login-password"]')).toBeVisible();
    await expect(page.locator('[data-testid="btn-submit-login"]')).toBeVisible();

    // A barra de navegação do app NÃO deve ser visível para usuários deslogados
    await expect(page.locator('[data-testid="bottom-navigation"]')).toHaveCount(0);
  });

  test('Exibe mensagem de erro ao submeter credenciais incorretas', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'UNAUTHORIZED',
          message: 'E-mail ou senha incorretos.',
        }),
      });
    });

    await page.goto('/');
    await page.locator('[data-testid="input-login-email"]').fill('errado@odonto.com');
    await page.locator('[data-testid="input-login-password"]').fill('senhaErrada123');
    await page.locator('[data-testid="btn-submit-login"]').click();

    const errorMessage = page.locator('[data-testid="error-alert-banner"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Credenciais inválidas');
  });

  test('Permite alternar a visibilidade da senha no formulário', async ({ page }) => {
    await page.goto('/');
    const passwordInput = page.locator('[data-testid="input-login-password"]');
    const toggleButton = page.locator('[data-testid="btn-toggle-password"]');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('Realiza login com sucesso, acessa a aplicação e permite logout seguro em Ajustes', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt-valid-token-playwright',
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
    await page.locator('[data-testid="input-login-email"]').fill('doutora@odonto.com');
    await page.locator('[data-testid="input-login-password"]').fill('SenhaForte123');
    await page.locator('[data-testid="btn-submit-login"]').click();

    // App liberado: Bottom navigation visível
    const bottomNav = page.locator('[data-testid="bottom-navigation"]');
    await expect(bottomNav).toBeVisible();

    // Navega para Ajustes e valida Card de Perfil do Consultório
    await page.locator('[data-testid="nav-tab-ajustes"]').click();
    const profileCard = page.locator('[data-testid="clinic-profile-card"]');
    await expect(profileCard).toBeVisible();
    await expect(profileCard).toContainText('Consultório OdontoFlow');

    // Executa Logout
    await page.locator('[data-testid="btn-request-logout"]').click();

    // Se abriu a gaveta de confirmação por ter itens na outbox, confirma a saída
    const confirmLogoutBtn = page.locator('[data-testid="btn-confirm-logout"]');
    try {
      await confirmLogoutBtn.waitFor({ state: 'visible', timeout: 3000 });
      await confirmLogoutBtn.click();
    } catch {
      // Se não abriu gaveta, o logout foi direto
    }

    // Retorna para a tela de Login
    await expect(page.locator('[data-testid="login-screen"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="bottom-navigation"]')).toHaveCount(0);

    // E-mail anterior permanece memorizado no campo
    await expect(page.locator('[data-testid="input-login-email"]')).toHaveValue('doutora@odonto.com');
  });
});
