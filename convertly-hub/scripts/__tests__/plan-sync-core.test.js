import planSyncCore from '../plan-sync-core.cjs';

const { PlanSyncUserNotFoundError, parsePlanSyncEnvironment, synchronizeUserPlan } = planSyncCore;

describe('one-off plan synchronization', () => {
  const allowedPlans = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];

  it('normalizes the explicit email and accepts only catalog plan values', () => {
    expect(
      parsePlanSyncEnvironment(
        { PLAN_SYNC_EMAIL: '  Member@Example.com ', PLAN_SYNC_ACTIVE_PLAN: ' pro ' },
        allowedPlans,
      ),
    ).toEqual({ email: 'member@example.com', plan: 'PRO' });
  });

  it('rejects incomplete or unsupported operator input before opening a database transaction', () => {
    expect(() => parsePlanSyncEnvironment({}, allowedPlans)).toThrow('PLAN_SYNC_EMAIL');
    expect(() =>
      parsePlanSyncEnvironment(
        { PLAN_SYNC_EMAIL: 'member@example.com', PLAN_SYNC_ACTIVE_PLAN: 'TEAM' },
        allowedPlans,
      ),
    ).toThrow('PLAN_SYNC_ACTIVE_PLAN');
  });

  it('updates only Subscription.activePlan in one transaction', async () => {
    const transaction = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          subscription: { activePlan: 'BASIC' },
        }),
      },
      subscription: { update: jest.fn().mockResolvedValue({ activePlan: 'PRO' }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(transaction)) };

    await expect(synchronizeUserPlan(prisma, 'member@example.com', 'PRO')).resolves.toEqual({
      previousActivePlan: 'BASIC',
      activePlan: 'PRO',
    });
    expect(transaction.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { activePlan: 'PRO', requestedPlan: null, status: 'ACTIVE' },
      select: { activePlan: true },
    });
  });

  it('does not create an account when the supplied email is unknown', async () => {
    const transaction = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      subscription: { update: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(transaction)) };

    await expect(
      synchronizeUserPlan(prisma, 'missing@example.com', 'BASIC'),
    ).rejects.toBeInstanceOf(PlanSyncUserNotFoundError);
    expect(transaction.subscription.update).not.toHaveBeenCalled();
  });
});
