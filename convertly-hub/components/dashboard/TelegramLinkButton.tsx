'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/lib/hooks/use-toast';

export function TelegramLinkButton({ label = 'Connect Telegram' }: { label?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleLinkTelegram() {
    startTransition(async () => {
      const response = await fetch('/api/account/telegram/link', { method: 'POST' });
      const payload = (await response.json()) as { deepLink?: string; error?: string };

      if (!response.ok || !payload.deepLink) {
        toast.error(payload.error ?? 'Unable to start Telegram linking.');
        return;
      }

      window.open(payload.deepLink, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <Button
      onClick={handleLinkTelegram}
      disabled={isPending}
      className="w-full md:w-[150px] whitespace-nowrap"
    >
      {isPending ? 'Preparing...' : label}
    </Button>
  );
}
