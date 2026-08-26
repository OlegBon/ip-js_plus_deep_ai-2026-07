import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('next-auth/react', () => ({ signIn: jest.fn() }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;
const getMockSignIn = () => jest.requireMock('next-auth/react').signIn;
const getMockUseRouter = () => jest.requireMock('next/navigation').useRouter;

describe('LoginForm authentication flow', () => {
  const router = { replace: jest.fn(), refresh: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    getMockUseRouter().mockReturnValue(router);
  });

  it('shows a generic error for rejected credentials', async () => {
    getMockSignIn().mockResolvedValue({ error: 'CredentialsSignin' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'person@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-secure-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(getMockSignIn()).toHaveBeenCalledWith('credentials', {
      email: 'person@example.com',
      password: 'a-secure-password',
      redirect: false,
    });
    expect(getMockToast().error).toHaveBeenCalledWith('Invalid email or password.');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('redirects to the dashboard after successful sign-in', async () => {
    getMockSignIn().mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'person@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-secure-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(router.replace).toHaveBeenCalledWith('/dashboard');
    expect(router.refresh).toHaveBeenCalled();
  });

  it('lets the user reveal and hide the password', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const password = screen.getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show Password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide Password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});
