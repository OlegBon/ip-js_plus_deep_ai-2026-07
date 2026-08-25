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
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const validate = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return 'Email is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedValue)) {
      return 'Please enter a valid email address.';
    }

    return ''; // No error
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (error) {
      setError(validate(newEmail));
    }
  };

  const handleBlur = () => {
    setError(validate(email));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to request a password reset.');
        return;
      }
      toast.success(payload.message ?? 'If an account with that email exists, a password reset link has been sent.');
    });
  };

  const isInvalid = !!error;

  return (
    <div className="bg-background-secondary flex flex-grow items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-headings text-text-primary text-3xl font-bold">
              Forgot Your Password?
            </CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a one-time link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleContactChange}
                  onBlur={handleBlur}
                  placeholder="name@example.com"
                  className={clsx({
                    'border-red-500 focus-visible:ring-red-500': isInvalid,
                  })}
                />
                {isInvalid && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={!email || isInvalid || isPending}>
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
