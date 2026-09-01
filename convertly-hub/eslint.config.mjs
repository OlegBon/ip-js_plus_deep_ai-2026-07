import { globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import tailwind from 'eslint-plugin-tailwindcss';

export default [
  ...nextVitals,
  ...nextTypeScript,
  {
    plugins: {
      tailwindcss: tailwind,
    },
    rules: {
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-custom-classname': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
    },
    settings: {
      tailwindcss: {
        config: 'app/globals.css',
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    // Dedicated output directory of playwright.integration.config.ts:
    '.next-integration/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
];
