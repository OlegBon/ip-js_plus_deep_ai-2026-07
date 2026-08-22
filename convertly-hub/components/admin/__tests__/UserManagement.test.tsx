import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../UserManagement';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;

describe('UserManagement integration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters users, opens the action menu, and deletes a user after confirmation', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<UserManagement />);

    await user.type(screen.getByPlaceholderText('Search users...'), 'Jane');
    act(() => jest.advanceTimersByTime(300));
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

    await user.pointer({ target: screen.getAllByRole('button')[0], keys: '[MouseLeft]' });
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('heading', { name: 'Delete User' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(getMockToast().success).toHaveBeenCalledWith('User Jane Smith has been deleted.');
    jest.useRealTimers();
  });
});
