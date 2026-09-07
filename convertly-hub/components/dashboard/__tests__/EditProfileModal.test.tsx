import React from 'react';
import { render, screen } from '@testing-library/react';
import EditProfileModal from '../EditProfileModal';

jest.mock('@/components/ui/Modal', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../TelegramLinkButton', () => ({
  TelegramLinkButton: ({ label }: { label: string }) => <button type="button">{label}</button>,
}));

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { error: jest.fn() } }));

describe('EditProfileModal', () => {
  it('uses browser autofill tokens for the editable identity fields', () => {
    render(
      <EditProfileModal
        isOpen
        name="Ada Lovelace"
        email="ada@example.com"
        telegramConnected={false}
        telegramUsername={null}
        telegramLinkInProgress={false}
        onClose={jest.fn()}
        onProfileUpdated={async () => undefined}
        onTelegramLinkStarted={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Name')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
  });

  it('shows the connected Telegram username and a responsive change action', () => {
    render(
      <EditProfileModal
        isOpen
        name="Ada Lovelace"
        email="ada@example.com"
        telegramConnected
        telegramUsername="ada_lovelace"
        telegramLinkInProgress={false}
        onClose={jest.fn()}
        onProfileUpdated={async () => undefined}
        onTelegramLinkStarted={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Connected as @ada_lovelace. Replace it with a one-time link.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change Telegram account' })).toBeInTheDocument();
  });
});
