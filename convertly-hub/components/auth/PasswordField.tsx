'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  autoComplete: 'current-password' | 'new-password';
  onChange: (value: string) => void;
  describedBy?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
};

export function PasswordField({
  id,
  label,
  value,
  autoComplete,
  onChange,
  describedBy,
  minLength,
  maxLength,
  required = true,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleLabel = isVisible ? `Hide ${label}` : `Show ${label}`;

  return (
    <div>
      <label htmlFor={id} className="text-text-primary block text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          value={value}
          aria-describedby={describedBy}
          minLength={minLength}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className="border-border bg-background text-text-primary focus:border-accent focus:ring-accent block w-full rounded-md px-3 py-2 pr-11 shadow-sm"
        />
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
          className="text-text-secondary hover:text-text-primary absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </div>
    </div>
  );
}
