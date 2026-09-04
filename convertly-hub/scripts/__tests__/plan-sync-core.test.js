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

  it('keeps User.plan and Subscription.activePlan synchronized in one transaction', async () => {
    const transaction = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          plan: 'FREE',
          subscription: { activePlan: 'BASIC' },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      subscription: { upsert: jest.fn().mockResolvedValue({ activePlan: 'PRO' }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(transaction)) };

    await expect(synchronizeUserPlan(prisma, 'member@example.com', 'PRO')).resolves.toEqual({
      previousUserPlan: 'FREE',
      previousSubscriptionPlan: 'BASIC',
      activePlan: 'PRO',
    });
    expect(transaction.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { plan: 'PRO' },
    });
    expect(transaction.subscription.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', activePlan: 'PRO', status: 'ACTIVE' },
      update: { activePlan: 'PRO', requestedPlan: null, status: 'ACTIVE' },
      select: { activePlan: true },
    });
  });

  it('does not create an account when the supplied email is unknown', async () => {
    const transaction = {
      user: { findUnique: jest.fn().mockResolvedValue(null), update: jest.fn() },
      subscription: { upsert: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(transaction)) };

    await expect(
      synchronizeUserPlan(prisma, 'missing@example.com', 'BASIC'),
    ).rejects.toBeInstanceOf(PlanSyncUserNotFoundError);
    expect(transaction.user.update).not.toHaveBeenCalled();
    expect(transaction.subscription.upsert).not.toHaveBeenCalled();
  });
});
