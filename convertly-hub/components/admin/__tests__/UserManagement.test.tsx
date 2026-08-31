import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../UserManagement';
jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
describe('UserManagement', () => {
  it('loads users from the real admin contract', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        users: [
          {
            id: 'u1',
            name: 'Jane Smith',
            email: 'jane@example.com',
            role: 'USER',
            status: 'ACTIVE',
            plan: 'FREE',
            lastLoginAt: null,
            apiKeys: [],
          },
        ],
        nextCursor: null,
        total: 1,
      }),
    });
    render(<UserManagement />);
    await waitFor(() => expect(screen.getByText('Jane Smith')).toBeInTheDocument());
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('applies and clears a live search without a submit button', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ users: [], nextCursor: null, total: 0 }),
    });
    render(<UserManagement />);

    const search = await screen.findByRole('textbox', { name: 'Search users' });
    await user.type(search, 'jane');
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/admin/users?limit=10&sort=createdAt&direction=desc&query=jane',
        expect.any(Object),
      ),
    );
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(search).toHaveValue('');
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/admin/users?limit=10&sort=createdAt&direction=desc',
        expect.any(Object),
      ),
    );
  });
});
