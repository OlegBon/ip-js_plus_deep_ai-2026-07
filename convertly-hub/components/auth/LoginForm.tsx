"use client";

import { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle login logic
    console.log('Login attempt with:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-primary">
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
            className="block w-full rounded-md border-border bg-background py-2 px-3 text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-text-primary">
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
            className="block w-full rounded-md border-border bg-background py-2 px-3 text-text-primary shadow-sm focus:border-accent focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <button type="submit" className="flex w-full justify-center rounded-md border border-transparent bg-gray-800 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
          Sign In
        </button>
      </div>
    </form>
  );
}
