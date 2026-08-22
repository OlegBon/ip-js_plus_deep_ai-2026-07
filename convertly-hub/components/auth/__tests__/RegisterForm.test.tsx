import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;

describe('RegisterForm', () => {
  beforeEach(() => jest.clearAllMocks());

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

  it('confirms successful registration when the passwords match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'same-password');
    await user.type(screen.getByLabelText('Confirm Password'), 'same-password');
    await user.click(screen.getByRole('button', { name: 'Register' }));

    expect(getMockToast().success).toHaveBeenCalledWith('Registration successful!');
  });
});
