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

  it('copies and regenerates the API key', async () => {
    const user = userEvent.setup();
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    render(<ApiKeyManager />);

    await user.click(screen.getByRole('button', { name: 'Copy API Key' }));
    expect(getMockToast().success).toHaveBeenCalledWith('API Key copied to clipboard!');

    await user.click(screen.getByRole('button', { name: 'Regenerate API Key' }));
    expect(getMockToast().success).toHaveBeenLastCalledWith('API Key regenerated!');
    expect(screen.getByRole('textbox')).not.toHaveValue('ch_xxxxxx_xxxxxxxxxxxxxxxxxxxx');
    randomSpy.mockRestore();
  });

  it('changes file-storage preference and reports the new state', async () => {
    const user = userEvent.setup();
    render(<PrivacySettings />);

    await user.click(screen.getByRole('button'));
    expect(getMockToast().success).toHaveBeenCalledWith('File storage disabled.');
  });
});
