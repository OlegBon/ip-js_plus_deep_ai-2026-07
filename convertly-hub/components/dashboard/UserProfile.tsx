'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import ConfirmationModal from '@/components/core/ConfirmationModal';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/hooks/use-toast';
import EditProfileModal from './EditProfileModal';
import { TelegramLinkButton } from './TelegramLinkButton';

type Profile = {
  name: string | null;
  email: string;
  emailVerified: boolean;
  telegramId: string | null;
  telegramVerified: boolean;
};

function StatusBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={
        verified
          ? 'rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'
          : 'rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800'
      }
    >
      {verified ? 'Verified' : 'Unverified'}
    </span>
  );
}

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isVerificationPending, startVerificationTransition] = useTransition();
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/account/profile', { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result: Profile | null) => setProfile(result))
      .catch(() => setProfile(null));
    return () => controller.abort();
  }, []);
  async function handleSaveName(name: string) {
    const response = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const result = (await response.json()) as Profile | { error?: string };
    if (!response.ok || !('email' in result)) {
      toast.error(
        'error' in result
          ? (result.error ?? 'Unable to update profile.')
          : 'Unable to update profile.',
      );
      return;
    }
    setProfile(result);
    setIsEditModalOpen(false);
    toast.success('Profile updated.');
  }
  function handleEmailVerification() {
    startVerificationTransition(async () => {
      const response = await fetch('/api/account/email-verification', { method: 'POST' });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to send the verification email.');
        return;
      }
      toast.success(payload.message ?? 'Verification email sent.');
    });
  }
  if (!profile) return <div className="rounded-lg bg-white p-6 shadow-md">Loading profile…</div>;
  return (
    <>
      <div className="space-y-6 rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="w-full">
            <p className="text-lg font-semibold">{profile.name || 'Unnamed user'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-gray-600">{profile.email}</p>
              <StatusBadge verified={profile.emailVerified} />
            </div>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            {!profile.emailVerified && (
              <Button
                variant="secondary"
                onClick={handleEmailVerification}
                disabled={isVerificationPending}
                className="w-full whitespace-nowrap md:w-[150px]"
              >
                {isVerificationPending ? 'Sending…' : 'Confirm email'}
              </Button>
            )}
            <Button onClick={() => setIsEditModalOpen(true)} className="w-full md:w-[150px]">
              Edit
            </Button>
          </div>
        </div>
        <div className="border-t border-gray-200" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="w-full">
            <p className="text-lg font-semibold">Telegram Account</p>
            {profile.telegramId ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-gray-600">Connected Telegram account</p>
                <StatusBadge verified={profile.telegramVerified} />
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Not connected. Use a one-time secure link to connect your account.
              </p>
            )}
          </div>
          {profile.telegramId && !profile.telegramVerified ? (
            <TelegramLinkButton label="Confirm Telegram" />
          ) : !profile.telegramId ? (
            <TelegramLinkButton />
          ) : null}
        </div>
        <div className="border-t border-gray-200" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="w-full">
            <p className="text-lg font-semibold">Reset Password</p>
            <p className="text-sm text-gray-500">Change your password.</p>
          </div>
          <Link
            href="/password-reset"
            className="text-sm font-medium text-accent hover:text-accent-hover"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="border-t border-gray-200" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="w-full">
            <p className="text-lg font-semibold">Delete Account</p>
            <p className="text-sm text-gray-500">
              Note: Account deletion will be handled by an administrator.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full md:w-[150px]"
          >
            Delete Account
          </Button>
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        name={profile.name ?? ''}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveName}
      />
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          setIsDeleteModalOpen(false);
          toast.success('Contact an administrator to request account deletion.');
        }}
        title="Delete Account"
        message="Account deletion is handled by an administrator. Do you want to close this request and contact an administrator?"
      />
    </>
  );
}
