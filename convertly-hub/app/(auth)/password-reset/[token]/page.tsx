'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PasswordField } from '@/components/auth/PasswordField';
import { toast } from '@/lib/hooks/use-toast';

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const params = useParams();
  const token = params.token;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    if (password.length < 12 || password.length > 128) {
      toast.error('Use a password from 12 to 128 characters.');
      return;
    }
    startTransition(async () => {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to reset password.');
        return;
      }
      toast.success(payload.message ?? 'Your password has been reset successfully!');
    });
  };

  return (
    <div className="bg-background-secondary flex flex-grow items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-headings text-text-primary text-3xl font-bold">
              Set a New Password
            </CardTitle>
            <CardDescription>Create a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <PasswordField
                id="password"
                label="New Password"
                value={password}
                autoComplete="new-password"
                onChange={setPassword}
                minLength={12}
                maxLength={128}
              />
              <PasswordField
                id="confirmPassword"
                label="Confirm New Password"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={setConfirmPassword}
                minLength={12}
                maxLength={128}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Resetting…' : 'Reset Password'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="text-accent hover:text-accent-hover font-medium">
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
