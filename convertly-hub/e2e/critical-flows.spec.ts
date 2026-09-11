import { expect, test } from '@playwright/test';

test('головна сторінка пропонує обидва напрями конвертації', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Seamless File Conversion' })).toBeVisible();
  await expect(page.getByText('Checking your session…')).toBeHidden();
  await expect(page.getByText('Image Converter', { exact: true })).toBeVisible();
  await expect(page.getByText('Document Converter', { exact: true })).toBeVisible();
});

test('сторінка входу відображає форму облікових даних', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

test('неавторизований користувач обирає тариф і переходить до реєстрації', async ({
  page,
}) => {
  const sessionResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/session' &&
      response.request().method() === 'GET',
  );
  await page.goto('/pricing');
  await sessionResponse;

  await expect(page.getByRole('button', { name: 'Create free account' })).toBeVisible();
  await page
    .getByRole('region', { name: 'Pro' })
    .getByRole('button', { name: 'Choose plan' })
    .click();

  await expect(page).toHaveURL(/\/register\?plan=PRO$/);
});

test('неавторизований користувач перенаправляється з особистого кабінету на вхід', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login$/);
});

test('неавторизований користувач перенаправляється з панелі адміністратора на вхід', async ({
  page,
}) => {
  await page.goto('/management');

  await expect(page).toHaveURL(/\/login$/);
});
