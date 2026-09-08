import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiKeyManager from '../ApiKeyManager';
import PrivacySettings from '../PrivacySettings';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('dashboard settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render API-key controls when the plan cannot use the API', async () => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/account/billing') {
        return Promise.resolve({ ok: true, json: async () => ({ activePlan: 'FREE' }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ apiKeys: [] }) });
    });

    render(<ApiKeyManager />);
    expect(
      await screen.findByText('API access is available from the Basic plan.'),
    ).toBeInTheDocument();
  });

  it('disables storage preference while its request is pending', async () => {
    const user = userEvent.setup();
    const preferenceRequest = deferred<{
      ok: boolean;
      json: () => Promise<{ storeConversions: boolean }>;
    }>();
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url === '/api/account/billing') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ activePlan: 'BASIC', storeConversions: true }),
        });
      }
      return preferenceRequest.promise;
    });

    render(<PrivacySettings />);
    await user.click(screen.getByRole('button', { name: 'Toggle file storage' }));

    expect(screen.getByText('Saving file storage preference…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle file storage' })).toBeDisabled();
    expect(global.fetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      preferenceRequest.resolve({ ok: true, json: async () => ({ storeConversions: false }) });
    });
    await waitFor(() =>
      expect(getMockToast().success).toHaveBeenCalledWith('File storage disabled.'),
    );
  });

  it('prevents duplicate API-key creation while the create request is pending', async () => {
    const user = userEvent.setup();
    const createRequest = deferred<{ ok: boolean; json: () => Promise<object> }>();
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/account/billing') {
        return Promise.resolve({ ok: true, json: async () => ({ activePlan: 'BASIC' }) });
      }
      if (url === '/api/account/api-keys' && init?.method === 'POST') {
        return createRequest.promise;
      }
      return Promise.resolve({ ok: true, json: async () => ({ apiKeys: [] }) });
    });

    render(<ApiKeyManager />);
    const createButton = await screen.findByRole('button', { name: 'Create key' });
    await user.click(createButton);

    expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Creating…' }));
    expect(global.fetch).toHaveBeenCalledTimes(3);

    await act(async () => {
      createRequest.resolve({
        ok: true,
        json: async () => ({
          apiKey: {
            id: 'key-1',
            name: 'Dashboard key',
            keyPrefix: 'ch_live',
            createdAt: '',
            lastUsedAt: null,
            revokedAt: null,
          },
          secret: 'ch_live_test',
        }),
      });
    });
    expect(await screen.findByText('ch_live_test')).toBeInTheDocument();
  });
});
