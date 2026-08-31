import { expect, test } from '@playwright/test';

test('главная страница предлагает оба направления конвертации', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Seamless File Conversion' })).toBeVisible();
  await expect(page.getByText('Checking your session…')).toBeHidden();
  await expect(page.getByText('Image Converter', { exact: true })).toBeVisible();
  await expect(page.getByText('Document Converter', { exact: true })).toBeVisible();
});

test('страница входа отображает форму учётных данных', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

test('неавторизированный пользователь выбирает тариф и переходит к регистрации', async ({
  page,
}) => {
  await page.goto('/pricing');

  await expect(page.getByRole('button', { name: 'Create free account' })).toBeVisible();
  await page
    .getByRole('region', { name: 'Pro' })
    .getByRole('button', { name: 'Choose plan' })
    .click();

  await expect(page).toHaveURL(/\/register\?plan=PRO$/);
});

test('неавторизированный пользователь перенаправляется из личного кабинета на вход', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
});

test('неавторизированный пользователь перенаправляется из панели администратора на вход', async ({
  page,
}) => {
  await page.goto('/management');

  await expect(page).toHaveURL(/\/login$/);
});
