import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApiKeyManager from '../ApiKeyManager';
import PrivacySettings from '../PrivacySettings';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;

describe('dashboard settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render API-key controls when the plan cannot use the API', async () => {
    render(<ApiKeyManager />);
    expect(await screen.findByText('API access is available from the Basic plan.')).toBeInTheDocument();
  });

  it('changes file-storage preference and reports the new state', async () => {
    const user = userEvent.setup();
    render(<PrivacySettings />);

    await user.click(screen.getByRole('button'));
    expect(getMockToast().success).toHaveBeenCalledWith('File storage disabled.');
  });
});
