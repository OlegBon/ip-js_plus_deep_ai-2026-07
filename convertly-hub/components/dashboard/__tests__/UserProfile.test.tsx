import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserProfile from '../UserProfile';

jest.mock('next-auth/react', () => ({ signOut: jest.fn() }));
jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const profile = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  pendingEmail: null,
  emailVerified: true,
  telegramId: '123456',
  telegramUsername: 'ada_lovelace',
  telegramVerified: true,
  telegramLinkPending: false,
};

describe('UserProfile Telegram controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/account/profile') {
        return Promise.resolve({ ok: true, json: async () => profile });
      }
      if (url === '/api/account/deletion-request') {
        return Promise.resolve({ ok: true, json: async () => ({ request: null }) });
      }
      if (url === '/api/account/telegram/link' && init?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({ disconnected: true }) });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    }) as jest.Mock;
  });

  it('confirms and disconnects the linked Telegram account without a layout-specific flow', async () => {
    const user = userEvent.setup();
    render(<UserProfile />);

    await screen.findByText('Connected as @ada_lovelace');
    expect(screen.getByRole('button', { name: 'Change Telegram account' })).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: 'Disconnect Telegram' })).toHaveClass('w-full');

    await user.click(screen.getByRole('button', { name: 'Disconnect Telegram' }));
    expect(screen.getByRole('heading', { name: 'Disconnect Telegram' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'You will no longer be able to receive password reset links in Telegram. Email recovery will remain available.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Disconnect$/ }));

    await waitFor(() => expect(screen.getByText('Not connected.')).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/api/account/telegram/link', { method: 'DELETE' });
    expect(jest.requireMock('@/lib/hooks/use-toast').toast.success).toHaveBeenCalledWith(
      'Telegram account disconnected.',
    );
  });

  it('keeps the pending Telegram status after the profile is refreshed', async () => {
    const pendingProfile = { ...profile, telegramLinkPending: true };
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/account/profile') {
        return Promise.resolve({ ok: true, json: async () => pendingProfile });
      }
      if (url === '/api/account/deletion-request') {
        return Promise.resolve({ ok: true, json: async () => ({ request: null }) });
      }
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    }) as jest.Mock;

    render(<UserProfile />);

    expect(await screen.findByText('Waiting for Telegram…')).toBeInTheDocument();
  });
});
