import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;
const getMockUseRouter = () => jest.requireMock('next/navigation').useRouter;

describe('RegisterForm', () => {
  const router = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    getMockUseRouter().mockReturnValue(router);
    global.fetch = jest.fn();
  });

  it('reports mismatched passwords and does not register the user', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'first-password');
    await user.type(screen.getByLabelText('Confirm Password'), 'second-password');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(getMockToast().error).toHaveBeenCalledWith("Passwords don't match");
    expect(getMockToast().success).not.toHaveBeenCalled();
  });

  it('creates an account through the registration API when the passwords match', async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: 'user-1' } }),
    } as Response);
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-secure-password');
    await user.type(screen.getByLabelText('Confirm Password'), 'a-secure-password');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'a-secure-password',
      }),
    });
    expect(getMockToast().success).toHaveBeenCalledWith('Registration successful! Please sign in.');
    expect(router.push).toHaveBeenCalledWith('/login');
  });
});
