'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from '@/lib/hooks/use-toast';
import { clsx } from 'clsx';

export default function PasswordResetPage() {
  const [contactInfo, setContactInfo] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const validate = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return 'Email or Telegram handle is required.';
    }

    if (trimmedValue.startsWith('@')) {
      // Validate as a Telegram handle
      // Telegram usernames are 5-32 characters long, can contain a-z, 0-9 and underscores.
      const telegramRegex = /^@[a-zA-Z0-9_]{5,32}$/;
      if (!telegramRegex.test(trimmedValue)) {
        return 'Please enter a valid Telegram handle (e.g., @username, 5-32 chars, a-z, 0-9, _).';
      }
    } else {
      // Validate as an email address
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedValue)) {
        return 'Please enter a valid email address.';
      }
    }

    return ''; // No error
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newContactInfo = e.target.value;
    setContactInfo(newContactInfo);
    if (error) {
      setError(validate(newContactInfo));
    }
  };

  const handleBlur = () => {
    setError(validate(contactInfo));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(contactInfo);
    if (validationError) {
      setError(validationError);
      return;
    }

    // TODO: Implement actual email/Telegram sending logic
    console.log(`Password reset request for ${contactInfo}`);
    toast.success(
      `If an account with that contact info exists, a password reset link has been sent.`,
    );
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
              Enter your email address or Telegram and we&apos;ll send you a link to reset your
              password.
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
                  autoComplete="email"
                  required
                  value={contactInfo}
                  onChange={handleContactChange}
                  onBlur={handleBlur}
                  placeholder="name@example.com or @telegram_handle"
                  className={clsx({
                    'border-red-500 focus-visible:ring-red-500': isInvalid,
                  })}
                />
                {isInvalid && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={!contactInfo || isInvalid}>
                Send Reset Link
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
