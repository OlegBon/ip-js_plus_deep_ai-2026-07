import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from '../page';

jest.mock('@/components/admin/SystemMonitoring', () => ({
  __esModule: true,
  default: ({ refreshKey }: { refreshKey: number }) => <p>Metrics version {refreshKey}</p>,
}));
jest.mock('@/components/admin/UserManagement', () => ({
  __esModule: true,
  default: ({ refreshKey }: { refreshKey: number }) => <p>Users version {refreshKey}</p>,
}));
jest.mock('@/components/admin/AccountDeletionRequests', () => ({
  __esModule: true,
  default: ({ onDeletionCompleted }: { onDeletionCompleted: () => void }) => (
    <button type="button" onClick={onDeletionCompleted}>
      Complete deletion
    </button>
  ),
}));

describe('AdminPage', () => {
  it('refreshes metrics and users after an account deletion completes', async () => {
    const user = userEvent.setup();
    render(<AdminPage />);

    expect(screen.getByText('Metrics version 0')).toBeInTheDocument();
    expect(screen.getByText('Users version 0')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete deletion' }));

    expect(screen.getByText('Metrics version 1')).toBeInTheDocument();
    expect(screen.getByText('Users version 1')).toBeInTheDocument();
  });
});
