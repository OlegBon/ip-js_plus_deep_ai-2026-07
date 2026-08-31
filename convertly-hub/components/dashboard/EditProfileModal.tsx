'use client';
import { FormEvent, useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { PasswordField } from '../auth/PasswordField';
import { TelegramLinkButton } from './TelegramLinkButton';
import { toast } from '@/lib/hooks/use-toast';
type Props = {
  isOpen: boolean;
  name: string;
  email: string;
  telegramConnected: boolean;
  onClose: () => void;
  onProfileUpdated: () => Promise<void>;
};
export default function EditProfileModal({
  isOpen,
  name,
  email,
  telegramConnected,
  onClose,
  onProfileUpdated,
}: Props) {
  const [displayName, setDisplayName] = useState(name),
    [nextEmail, setNextEmail] = useState(email),
    [currentPassword, setCurrentPassword] = useState(''),
    [password, setPassword] = useState(''),
    [confirmPassword, setConfirmPassword] = useState(''),
    [isSaving, setIsSaving] = useState(false),
    [isCurrentPasswordMissing, setIsCurrentPasswordMissing] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const isEmailChanging = nextEmail.trim().toLowerCase() !== email;
    const isPasswordChanging = Boolean(password || confirmPassword);
    if ((isEmailChanging || isPasswordChanging) && !currentPassword) {
      setIsCurrentPasswordMissing(true);
      toast.error('Enter your current password to change email or password.');
      return;
    }
    if (isPasswordChanging && password !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      if (displayName.trim() !== name)
        await api('/api/account/profile', 'PATCH', { name: displayName });
      if (isEmailChanging)
        await api('/api/account/email', 'POST', { email: nextEmail, currentPassword });
      if (isPasswordChanging)
        await api('/api/account/password', 'POST', { currentPassword, password, confirmPassword });
      await onProfileUpdated();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update profile.');
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <form className="space-y-5 pt-4" onSubmit={submit}>
        <p className="text-sm text-gray-500">For security, enter your current password before changing your email or password.</p>
        <label className="block text-sm font-semibold">
          Name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={1}
            maxLength={80}
            className="mt-2 w-full rounded border p-2"
          />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input
            type="email"
            value={nextEmail}
            onChange={(e) => setNextEmail(e.target.value)}
            required
            className="mt-2 w-full rounded border p-2"
          />
        </label>
        <div className="border-t pt-4">
          <p className="font-semibold">Telegram Account</p>
          <p className="mb-3 text-sm text-gray-500">
            {telegramConnected
              ? 'Replace the connected account with a one-time link.'
              : 'Connect an account with a one-time link.'}
          </p>
          <TelegramLinkButton
            label={telegramConnected ? 'Change Telegram account' : 'Connect Telegram'}
          />
        </div>
        <div className="space-y-3 border-t pt-4">
          <PasswordField
            id="current-password"
            label="Current Password"
            value={currentPassword}
            autoComplete="current-password"
            onChange={(value) => { setCurrentPassword(value); setIsCurrentPasswordMissing(false); }}
            required={false}
            hasError={isCurrentPasswordMissing}
          />
          {isCurrentPasswordMissing && <p className="text-sm text-red-600">Current password is required for this change.</p>}
          <p className="text-xs text-gray-500">Required to change email or password.</p>
          <PasswordField
            id="new-password"
            label="New Password"
            value={password}
            autoComplete="new-password"
            onChange={setPassword}
            required={false}
          />
          <PasswordField
            id="confirm-new-password"
            label="Confirm New Password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={setConfirmPassword}
            required={false}
          />
        </div>
        <div className="flex justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
async function api(path: string, method: string, body: Record<string, string>) {
  const r = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const p = (await r.json()) as { error?: string };
  if (!r.ok) throw new Error(p.error ?? 'Unable to update profile.');
}
