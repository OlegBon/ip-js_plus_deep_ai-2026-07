'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { isSubscriptionPlan } from '@/lib/billing/plans';
import { toast } from '@/lib/hooks/use-toast';
import { Button } from '../ui/Button';
import { PasswordField } from './PasswordField';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/auth/password-policy';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = (await response.json()) as { error?: string; emailVerificationSent?: boolean };

      if (!response.ok) {
        toast.error(payload.error ?? 'Unable to create an account.');
        return;
      }

      const plan = new URLSearchParams(window.location.search).get('plan');
      const callbackUrl = isSubscriptionPlan(plan) ? `/pricing?checkout=${plan}` : '/dashboard';
      toast.success(payload.emailVerificationSent === false
        ? 'Registration successful! Please sign in and resend the verification email from Dashboard.'
        : 'Registration successful! Check your email to verify your account.');
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="text-text-primary block text-sm font-medium"
        >
          Name
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border bg-background text-text-primary focus:border-accent focus:ring-accent block w-full rounded-md px-3 py-2 shadow-sm"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="text-text-primary block text-sm font-medium"
        >
          Email
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border bg-background text-text-primary focus:border-accent focus:ring-accent block w-full rounded-md px-3 py-2 shadow-sm"
          />
        </div>
      </div>

      <div>
        <PasswordField id="password" label="Password" value={password} autoComplete="new-password" onChange={setPassword} describedBy="password-requirements" minLength={PASSWORD_MIN_LENGTH} maxLength={PASSWORD_MAX_LENGTH} />
        <p id="password-requirements" className="text-text-secondary mt-2 text-sm">Use {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters.</p>
      </div>

      <PasswordField id="confirm-password" label="Confirm Password" value={confirmPassword} autoComplete="new-password" onChange={setConfirmPassword} />

      <div>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Creating account...' : 'Register'}
        </Button>
      </div>
    </form>
  );
}
