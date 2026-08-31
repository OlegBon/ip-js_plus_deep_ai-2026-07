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
  pendingEmail: string | null;
  emailVerified: boolean;
  telegramId: string | null;
  telegramVerified: boolean;
};
function Badge({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? 'rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800'
          : 'rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs text-yellow-800'
      }
    >
      {ok ? 'Verified' : 'Unverified'}
    </span>
  );
}
export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null),
    [edit, setEdit] = useState(false),
    [remove, setRemove] = useState(false),
    [sending, startSending] = useTransition();
  async function refresh() {
    const r = await fetch('/api/account/profile');
    if (r.ok) setProfile((await r.json()) as Profile);
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/account/profile', { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result: Profile | null) => setProfile(result))
      .catch(() => setProfile(null));
    return () => controller.abort();
  }, []);
  function verify() {
    startSending(async () => {
      const r = await fetch('/api/account/email-verification', { method: 'POST' });
      const p = (await r.json()) as { error?: string; message?: string };
      if (r.ok) toast.success(p.message ?? 'Verification email sent.');
      else toast.error(p.error ?? 'Unable to send verification email.');
    });
  }
  if (!profile) return <div className="rounded-lg bg-white p-6 shadow-md">Loading profile…</div>;
  const needsEmailConfirmation = !profile.emailVerified || Boolean(profile.pendingEmail);
  return (
    <>
      <div className="space-y-6 rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-semibold">{profile.name || 'Unnamed user'}</p>
            <div className="flex flex-wrap gap-2">
              <p>{profile.email}</p>
              <Badge ok={profile.emailVerified} />
            </div>
            {profile.pendingEmail && (
              <p className="mt-1 text-sm text-gray-500">
                New email pending confirmation: {profile.pendingEmail}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {needsEmailConfirmation && (
              <Button variant="secondary" onClick={verify} disabled={sending} className="w-full whitespace-nowrap md:w-[150px]">
                {sending
                  ? 'Sending…'
                  : profile.pendingEmail
                    ? 'Confirm new email'
                    : 'Confirm email'}
              </Button>
            )}
            <Button onClick={() => setEdit(true)} className="w-full md:w-[150px]">Edit</Button>
          </div>
        </div>
        <div className="border-t" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-semibold">Telegram Account</p>
            <p className="text-sm text-gray-500">
              {profile.telegramId ? 'Connected Telegram account' : 'Not connected.'}
            </p>
            {profile.telegramId && <Badge ok={profile.telegramVerified} />}
          </div>
          {profile.telegramId && !profile.telegramVerified ? (
            <TelegramLinkButton label="Confirm Telegram" />
          ) : !profile.telegramId ? (
            <TelegramLinkButton />
          ) : null}
        </div>
        <div className="border-t" />
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Reset Password</p>
            <p className="text-sm text-gray-500">Change your password.</p>
          </div>
          <Link
            href="/password-reset"
            className="whitespace-nowrap text-sm font-medium text-accent"
          >
            Forgot your password?
          </Link>
        </div>
        <div className="border-t" />
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Delete Account</p>
            <p className="text-sm text-gray-500">
              Note: Account deletion will be handled by an administrator.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setRemove(true)} className="w-full md:w-[150px]">
            Delete Account
          </Button>
        </div>
      </div>
      <EditProfileModal
        key={`${profile.name ?? ''}:${profile.email}:${profile.pendingEmail ?? ''}`}
        isOpen={edit}
        name={profile.name ?? ''}
        email={profile.email}
        telegramConnected={Boolean(profile.telegramId)}
        onClose={() => setEdit(false)}
        onProfileUpdated={refresh}
      />
      <ConfirmationModal
        isOpen={remove}
        onClose={() => setRemove(false)}
        onConfirm={() => {
          setRemove(false);
          toast.success('Contact an administrator to request account deletion.');
        }}
        title="Delete Account"
        message="Account deletion is handled by an administrator."
      />
    </>
  );
}
