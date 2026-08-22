import { expect, test } from '@playwright/test';

test('главная страница предлагает оба направления конвертации', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Seamless File Conversion' })).toBeVisible();
  await expect(page.getByText('Image Converter')).toBeVisible();
  await expect(page.getByText('Document Converter')).toBeVisible();
});

test('пользователь может войти с доступными демонстрационными данными', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Login successful!')).toBeVisible();
});

test('пользователь выбирает тариф и подтверждает имитацию оплаты', async ({ page }) => {
  await page.goto('/pricing');

  await page.getByRole('button', { name: 'Get started' }).nth(2).click();
  await expect(page.getByRole('heading', { name: 'Payment for Pro Plan' })).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('Payment for Pro plan successful!');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Proceed to Payment' }).click();

  await expect(page.getByRole('heading', { name: 'Payment for Pro Plan' })).toBeHidden();
});

test('пользователь ищет и удаляет конверсию в личном кабинете', async ({ page }) => {
  await page.goto('/dashboard');

  const search = page.getByPlaceholder('Search files...');
  await search.fill('invoice');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByText('invoice.pdf')).toBeVisible();
  await expect(page.getByText('report.docx')).toBeHidden();

  await page.locator('tbody input[type="checkbox"]').check();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Delete Conversions' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();

  await expect(page.getByText('invoice.pdf')).toBeHidden();
  await expect(page.getByText('1 item(s) have been deleted.')).toBeVisible();
});

test('администратор ищет и удаляет пользователя после подтверждения', async ({ page }) => {
  await page.goto('/management');

  await page.getByPlaceholder('Search users...').fill('Jane');
  await expect(page.getByText('Jane Smith')).toBeVisible();

  await page.getByRole('row', { name: /Jane Smith/ }).getByRole('button').click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Delete User' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();

  await expect(page.getByText('Jane Smith')).toBeHidden();
});
