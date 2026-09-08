import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SystemMonitoring from '../SystemMonitoring';

const metrics = {
  activeUsers: 4,
  activeUsersWindowDays: 30,
  totalConversions: 12,
  failedConversions: 1,
  errorRate: 8.3,
  services: { database: 'up' as const, gotenberg: 'up' as const, storage: 'up' as const },
};

describe('SystemMonitoring', () => {
  it('shows a loading state before metrics arrive', () => {
    global.fetch = jest.fn(() => new Promise(() => undefined));

    render(<SystemMonitoring />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading system metrics…');
  });

  it('shows a retry action after a failed load and recovers with refreshed metrics', async () => {
    const user = userEvent.setup();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => metrics });

    render(<SystemMonitoring />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load system metrics.');

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.getByText('Total conversions')).toBeInTheDocument());
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
