'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from '@/lib/hooks/use-toast';
import { clsx } from 'clsx';

export default function PasswordResetPage() {
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const validate = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return 'Email or Telegram handle is required.';
    }

    if (trimmedValue.startsWith('@'))
      return /^@[a-zA-Z0-9_]{5,32}$/.test(trimmedValue)
        ? ''
        : 'Enter a valid Telegram handle (for example, @username; 5–32 letters, numbers, or underscores).';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      return 'Please enter a valid email address.';
    }

    return ''; // No error
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContact = e.target.value;
    setContact(newContact);
    if (error) {
      setError(validate(newContact));
    }
  };

  const handleBlur = () => {
    setError(validate(contact));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(contact);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to request a password reset.');
        return;
      }
      toast.success(
        payload.message ??
          'If an account with that contact method exists, a password reset link has been sent.',
      );
    });
  };

  const isInvalid = !!error;

  return (
    <div className="bg-background-secondary flex flex-grow items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-headings text-text-primary text-3xl font-bold">
              Forgot Your Password?
            </CardTitle>
            <CardDescription>
              Enter your verified email address or linked Telegram handle and we&apos;ll send a
              one-time password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contact">Email or Telegram</Label>
                <Input
                  id="contact"
                  name="contact"
                  type="text"
                  autoComplete="username"
                  required
                  value={contact}
                  onChange={handleContactChange}
                  onBlur={handleBlur}
                  placeholder="name@example.com or @telegram_handle"
                  className={clsx({
                    'border-red-500 focus-visible:ring-red-500': isInvalid,
                  })}
                />
                {isInvalid && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!contact || isInvalid || isPending}
              >
                {isPending ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button
                onClick={() => router.back()}
                className="text-accent hover:text-accent-hover font-medium"
              >
                Back
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
