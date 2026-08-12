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
        <button type="submit" className="focus:ring-accent flex w-full justify-center rounded-md border border-transparent bg-gray-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-900 focus:ring-2 focus:ring-offset-2 focus:outline-none">
          Sign In
        </button>
      </div>
    </form>
  );
}
