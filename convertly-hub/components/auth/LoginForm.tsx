"use client";

import { useState } from 'react';
import { toast } from '@/lib/hooks/use-toast';
import { Button } from '../ui/Button';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login logic
    if (email === 'admin@example.com' && password === 'password') {
      toast.success('Login successful!');
    } else {
      toast.error('Invalid email or password.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="text-text-primary block text-sm font-medium">
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
        <label htmlFor="password" className="text-text-primary block text-sm font-medium">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-border bg-background text-text-primary focus:border-accent focus:ring-accent block w-full rounded-md px-3 py-2 shadow-sm"
          />
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </div>
    </form>
  );
}
