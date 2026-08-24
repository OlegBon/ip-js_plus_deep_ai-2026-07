import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;

describe('LoginForm authentication flow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not use demo credentials before server verification is implemented', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Password'), 'password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(getMockToast().error).toHaveBeenCalledWith(
      'Sign-in will be available after credential verification is implemented.',
    );
    expect(getMockToast().success).not.toHaveBeenCalled();
  });
});
