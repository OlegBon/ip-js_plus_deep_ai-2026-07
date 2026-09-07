'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { signOut } from 'next-auth/react';
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
  telegramUsername: string | null;
  telegramVerified: boolean;
};
type DeletionRequest = {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  requestedAt: string;
  failureReason: string | null;
};
type DeletionRequestResponse = { request: DeletionRequest | null; accountDeleted: boolean } | null;
type TelegramLinkWatch = {
  telegramId: string | null;
  telegramUsername: string | null;
};

async function fetchDeletionRequest(signal?: AbortSignal): Promise<DeletionRequestResponse> {
  const response = await fetch('/api/account/deletion-request', { signal, cache: 'no-store' });
  if (response.status === 410) return { request: null, accountDeleted: true };
  if (!response.ok) return null;
  return {
    ...((await response.json()) as { request: DeletionRequest | null }),
    accountDeleted: false,
  };
}
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
    [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null),
    [telegramLinkWatch, setTelegramLinkWatch] = useState<TelegramLinkWatch | null>(null),
    [sending, startSending] = useTransition();
  const refreshDeletionRequest = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await fetchDeletionRequest(signal);
      if (result?.accountDeleted) {
        await signOut({ callbackUrl: '/?accountDeleted=1' });
        return;
      }
      if (result) setDeletionRequest(result.request);
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') setDeletionRequest(null);
    }
  }, []);
  async function refresh() {
    const r = await fetch('/api/account/profile');
    if (r.ok) setProfile((await r.json()) as Profile);
  }
  function startTelegramLinkWatch() {
    setTelegramLinkWatch({
      telegramId: profile?.telegramId ?? null,
      telegramUsername: profile?.telegramUsername ?? null,
    });
  }
  useEffect(() => {
    const controller = new AbortController();
    const profileRequest = fetch('/api/account/profile', { signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result: Profile | null) => setProfile(result))
      .catch(() => setProfile(null));
    const deletionRequest = fetchDeletionRequest(controller.signal)
      .then(async (result) => {
        if (result?.accountDeleted) await signOut({ callbackUrl: '/?accountDeleted=1' });
        else if (result) setDeletionRequest(result.request);
      })
      .catch(() => setDeletionRequest(null));
    void Promise.all([profileRequest, deletionRequest]);
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!deletionRequest?.status) return;
    const timer = window.setInterval(() => void refreshDeletionRequest(), 30_000);
    return () => window.clearInterval(timer);
  }, [deletionRequest?.status, refreshDeletionRequest]);
  useEffect(() => {
    if (!telegramLinkWatch) return;

    let active = true;
    const refreshTelegramLink = async () => {
      try {
        const response = await fetch('/api/account/profile', { cache: 'no-store' });
        if (!response.ok || !active) return;
        const updatedProfile = (await response.json()) as Profile;
        setProfile(updatedProfile);
        const accountChanged =
          updatedProfile.telegramId !== telegramLinkWatch.telegramId ||
          updatedProfile.telegramUsername !== telegramLinkWatch.telegramUsername;
        if (updatedProfile.telegramId && accountChanged) {
          setTelegramLinkWatch(null);
          toast.success('Telegram account connected.');
        }
      } catch {
        // A temporary polling failure should not affect the profile currently on screen.
      }
    };

    void refreshTelegramLink();
    const timer = window.setInterval(() => void refreshTelegramLink(), 5_000);
    const timeout = window.setTimeout(() => setTelegramLinkWatch(null), 2 * 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
  }, [telegramLinkWatch]);
  function verify() {
    startSending(async () => {
      const r = await fetch('/api/account/email-verification', { method: 'POST' });
      const p = (await r.json()) as { error?: string; message?: string };
      if (r.ok) toast.success(p.message ?? 'Verification email sent.');
      else toast.error(p.error ?? 'Unable to send verification email.');
    });
  }
  function submitDeletionRequest() {
    startSending(async () => {
      const response = await fetch('/api/account/deletion-request', { method: 'POST' });
      const payload = (await response.json()) as {
        request?: DeletionRequest;
        alreadyRequested?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.request) {
        toast.error(payload.error ?? 'Unable to submit the deletion request.');
        return;
      }
      setDeletionRequest(payload.request);
      setRemove(false);
      toast.success(
        payload.alreadyRequested
          ? 'Your deletion request is already awaiting an administrator.'
          : 'Deletion request submitted to the administrator.',
      );
    });
  }
  function cancelDeletionRequest() {
    startSending(async () => {
      const response = await fetch('/api/account/deletion-request', { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to cancel the deletion request.');
        return;
      }
      setDeletionRequest(null);
      toast.success('Deletion request cancelled.');
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
              <Button
                variant="secondary"
                onClick={verify}
                disabled={sending}
                className="w-full whitespace-nowrap md:w-[150px]"
              >
                {sending
                  ? 'Sending…'
                  : profile.pendingEmail
                    ? 'Confirm new email'
                    : 'Confirm email'}
              </Button>
            )}
            <Button onClick={() => setEdit(true)} className="w-full md:w-[150px]">
              Edit
            </Button>
          </div>
        </div>
        <div className="border-t" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-lg font-semibold">Telegram Account</p>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <p>
                {profile.telegramId
                  ? profile.telegramUsername
                    ? `Connected as @${profile.telegramUsername}`
                    : 'Connected Telegram account'
                  : 'Not connected.'}
              </p>
              {profile.telegramId && <Badge ok={profile.telegramVerified} />}
            </div>
            {telegramLinkWatch && (
              <p className="mt-1 text-sm text-gray-500">Waiting for confirmation in Telegram…</p>
            )}
          </div>
          {profile.telegramId && !profile.telegramVerified ? (
            <TelegramLinkButton label="Confirm Telegram" onLinkStarted={startTelegramLinkWatch} />
          ) : !profile.telegramId ? (
            <TelegramLinkButton onLinkStarted={startTelegramLinkWatch} />
          ) : null}
        </div>
        <div className="border-t" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
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
              {deletionRequest?.status === 'PENDING'
                ? `Request submitted ${new Date(deletionRequest.requestedAt).toLocaleString()}. An administrator will review it.`
                : deletionRequest?.status === 'PROCESSING'
                  ? 'Your deletion request is being processed.'
                  : deletionRequest?.status === 'FAILED'
                    ? 'The request needs another administrator review. You can submit it again.'
                    : 'An administrator will review and confirm account deletion.'}
            </p>
            {deletionRequest?.status === 'FAILED' && deletionRequest.failureReason && (
              <p className="mt-1 text-sm text-red-700">{deletionRequest.failureReason}</p>
            )}
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Button
              variant="secondary"
              className="flex-1 whitespace-nowrap md:flex-none"
              onClick={() => setRemove(true)}
              disabled={
                sending ||
                deletionRequest?.status === 'PENDING' ||
                deletionRequest?.status === 'PROCESSING'
              }
            >
              {deletionRequest?.status === 'PENDING'
                ? 'Request submitted'
                : deletionRequest?.status === 'FAILED'
                  ? 'Request again'
                  : 'Delete Account'}
            </Button>
            {deletionRequest?.status === 'PENDING' && (
              <Button
                variant="outline"
                className="flex-1 whitespace-nowrap md:flex-none"
                onClick={cancelDeletionRequest}
                disabled={sending}
              >
                Cancel request
              </Button>
            )}
          </div>
        </div>
      </div>
      <EditProfileModal
        key={`${profile.name ?? ''}:${profile.email}:${profile.pendingEmail ?? ''}`}
        isOpen={edit}
        name={profile.name ?? ''}
        email={profile.email}
        telegramConnected={Boolean(profile.telegramId)}
        telegramUsername={profile.telegramUsername}
        telegramLinkInProgress={Boolean(telegramLinkWatch)}
        onClose={() => setEdit(false)}
        onProfileUpdated={refresh}
        onTelegramLinkStarted={startTelegramLinkWatch}
      />
      <ConfirmationModal
        isOpen={remove}
        onClose={() => setRemove(false)}
        onConfirm={submitDeletionRequest}
        title="Delete Account"
        message="This sends a deletion request to an administrator. Your account and stored files remain available until the request is approved."
        confirmLabel="Request deletion"
        isPending={sending}
      />
    </>
  );
}
