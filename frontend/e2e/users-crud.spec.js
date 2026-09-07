import { test, expect } from '@playwright/test';

test.describe('E2E - Gestão de Usuários (CRUD Completo)', () => {
  const testUser = {
    name: `E2E User ${Date.now()}`,
    email: `e2e_${Date.now()}@example.com`,
    updatedName: `E2E User Atualizado ${Date.now()}`,
  };

  test('deve carregar a aplicação, criar, buscar, editar e excluir um usuário', async ({ page }) => {
    // 1. Acessa a aplicação
    await page.goto('/');

    // Verifica que a interface carregou
    await expect(page.locator('h1')).toHaveText('Gestão de Usuários');

    // 2. Criação de Usuário
    await page.click('button:has-text("Novo Usuário")');
    await expect(page.locator('.modal-title')).toHaveText('Novo Usuário');

    // Preenche o formulário
    await page.fill('#userName', testUser.name);
    await page.fill('#userEmail', testUser.email);
    await page.click('button[type="submit"]');

    // Verifica mensagem de sucesso Toast
    await expect(page.locator('.toast.success')).toContainText('Usuário cadastrado com sucesso!');

    // Verifica se o usuário aparece na listagem
    await expect(page.locator(`text=${testUser.name}`)).toBeVisible();
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible();

    // 3. Busca em tempo real
    await page.fill('input[placeholder*="Buscar por nome"]', testUser.name);
    await expect(page.locator(`text=${testUser.name}`)).toBeVisible();

    // Limpa a busca
    await page.fill('input[placeholder*="Buscar por nome"]', '');

    // 4. Edição de Usuário
    // Encontra a linha da tabela correspondente ao usuário criado
    const userRow = page.locator('tr', { hasText: testUser.name });
    await userRow.locator('button.btn-icon.edit').click();

    await expect(page.locator('.modal-title')).toHaveText('Editar Usuário');
    await page.fill('#userName', testUser.updatedName);
    await page.click('button[type="submit"]');

    // Verifica confirmação da edição
    await expect(page.locator('.toast.success')).toContainText('Usuário atualizado com sucesso!');
    await expect(page.locator(`text=${testUser.updatedName}`)).toBeVisible();

    // 5. Exclusão de Usuário
    const updatedRow = page.locator('tr', { hasText: testUser.updatedName });
    await updatedRow.locator('button.btn-icon.delete').click();

    // Modal de confirmação
    await expect(page.locator('.modal-title')).toContainText('Excluir Usuário');
    await page.click('button:has-text("Confirmar Exclusão")');

    // Verifica mensagem de remoção
    await expect(page.locator('.toast.success')).toContainText('Usuário removido com sucesso!');
    await expect(page.locator(`text=${testUser.updatedName}`)).not.toBeVisible();
  });
});
