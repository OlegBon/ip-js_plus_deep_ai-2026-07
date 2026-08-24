import { expect, test } from '@playwright/test';

test('главная страница предлагает оба направления конвертации', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Seamless File Conversion' })).toBeVisible();
  await expect(page.getByText('Image Converter')).toBeVisible();
  await expect(page.getByText('Document Converter')).toBeVisible();
});

test('форма входа не создаёт демо-сессию до реализации проверки учётных данных', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Login successful!')).toHaveCount(0);
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

test('неавторизированный пользователь перенаправляется из личного кабинета на вход', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
});

test('неавторизированный пользователь перенаправляется из панели администратора на вход', async ({ page }) => {
  await page.goto('/management');

  await expect(page).toHaveURL(/\/login$/);
});
