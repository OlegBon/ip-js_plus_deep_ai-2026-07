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
        onClose={jest.fn()}
        onProfileUpdated={async () => undefined}
      />,
    );

    expect(screen.getByLabelText('Name')).toHaveAttribute('autocomplete', 'name');
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
  });
});
