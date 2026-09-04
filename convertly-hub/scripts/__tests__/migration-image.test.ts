import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('migration Docker image', () => {
  it('includes every one-off database administration script and its dependency', () => {
    const dockerfile = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8');

    expect(dockerfile).toContain(
      'COPY scripts/seed-first-admin.mjs ./scripts/seed-first-admin.mjs',
    );
    expect(dockerfile).toContain('COPY scripts/plan-sync-core.cjs ./scripts/plan-sync-core.cjs');
    expect(dockerfile).toContain('COPY scripts/sync-user-plan.mjs ./scripts/sync-user-plan.mjs');
    expect(dockerfile).toContain(
      'COPY scripts/guest-quota-reset-core.cjs ./scripts/guest-quota-reset-core.cjs',
    );
    expect(dockerfile).toContain(
      'COPY scripts/reset-guest-quota.mjs ./scripts/reset-guest-quota.mjs',
    );
  });
});
