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

  it('requires confirmation before changing a status or revoking an API key', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.startsWith('/api/admin/users?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            users: [
              {
                id: 'u1',
                name: 'Jane Smith',
                email: 'jane@example.com',
                role: 'USER',
                status: 'ACTIVE',
                plan: 'BASIC',
                lastLoginAt: null,
                apiKeys: [{ id: 'key-1', name: 'Integration', keyPrefix: 'ch_live' }],
              },
            ],
            nextCursor: null,
            total: 1,
          }),
        });
      }
      return Promise.resolve({ ok: true });
    });
    render(<UserManagement />);
    await screen.findByText('Jane Smith');

    await user.click(screen.getByRole('button', { name: 'Suspend' }));
    expect(screen.getByText('Suspend user?')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Suspend user' }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/admin/users/u1/status',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );

    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(screen.getByText('Revoke API key?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Revoke key' }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith('/api/admin/api-keys/key-1', {
        method: 'DELETE',
      }),
    );
  });
});
