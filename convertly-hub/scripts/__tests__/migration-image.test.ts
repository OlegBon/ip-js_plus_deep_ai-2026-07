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
    expect(dockerfile).toContain('COPY scripts/audit-subscription-plans.mjs ./scripts/audit-subscription-plans.mjs');
    expect(dockerfile).toContain('apt-get install -y --no-install-recommends openssl');
  });
});
