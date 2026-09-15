import { test, expect } from '@playwright/test';

test.describe('E2E - Gestão de Usuários (CRUD Completo)', () => {
  const timestamp = Date.now();
  const testUser = {
    nome: `Usuario`,
    sobrenome: `E2E ${timestamp}`,
    email: `e2e_${timestamp}@example.com`,
    telefone: '(11) 98765-4321',
    cidade: 'São Paulo',
    updatedSobrenome: `E2E Atualizado ${timestamp}`,
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
    await page.fill('#userNome', testUser.nome);
    await page.fill('#userSobrenome', testUser.sobrenome);
    await page.fill('#userEmail', testUser.email);
    await page.fill('#userTelefone', testUser.telefone);
    await page.fill('#userCidade', testUser.cidade);
    await page.click('button[type="submit"]');

    // Verifica mensagem de sucesso Toast
    await expect(page.locator('.toast.success')).toContainText('Usuário cadastrado com sucesso!');

    // Verifica se o usuário aparece na listagem
    const fullName = `${testUser.nome} ${testUser.sobrenome}`;
    await expect(page.locator(`text=${fullName}`)).toBeVisible();
    await expect(page.locator(`text=${testUser.email}`)).toBeVisible();

    // 3. Busca em tempo real
    await page.fill('input[placeholder*="Buscar por nome"]', testUser.sobrenome);
    await expect(page.locator(`text=${fullName}`)).toBeVisible();

    // Limpa a busca
    await page.fill('input[placeholder*="Buscar por nome"]', '');

    // 4. Edição de Usuário
    const userRow = page.locator('tr', { hasText: fullName });
    await userRow.locator('button.btn-icon.edit').click();

    await expect(page.locator('.modal-title')).toHaveText('Editar Usuário');
    await page.fill('#userSobrenome', testUser.updatedSobrenome);
    await page.click('button[type="submit"]');

    // Verifica confirmação da edição
    await expect(page.locator('.toast.success')).toContainText('Usuário atualizado com sucesso!');
    const updatedFullName = `${testUser.nome} ${testUser.updatedSobrenome}`;
    await expect(page.locator(`text=${updatedFullName}`)).toBeVisible();

    // 5. Exclusão de Usuário
    const updatedRow = page.locator('tr', { hasText: updatedFullName });
    await updatedRow.locator('button.btn-icon.delete').click();

    // Modal de confirmação
    await expect(page.locator('.modal-title')).toContainText('Excluir Usuário');
    await page.click('button:has-text("Confirmar Exclusão")');

    // Verifica mensagem de remoção
    await expect(page.locator('.toast.success')).toContainText('Usuário removido com sucesso!');
    await expect(page.locator(`text=${updatedFullName}`)).not.toBeVisible();
  });
});
