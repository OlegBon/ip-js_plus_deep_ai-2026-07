const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class PlanSyncUserNotFoundError extends Error {
  constructor() {
    super('No registered user matches the supplied email.');
    this.name = 'PlanSyncUserNotFoundError';
  }
}

function parsePlanSyncEnvironment(environment, allowedPlans) {
  const email = environment.PLAN_SYNC_EMAIL?.trim().toLowerCase() ?? '';
  const plan = environment.PLAN_SYNC_ACTIVE_PLAN?.trim().toUpperCase() ?? '';

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new Error('PLAN_SYNC_EMAIL must contain a valid registered user email.');
  }
  if (!allowedPlans.includes(plan)) {
    throw new Error(`PLAN_SYNC_ACTIVE_PLAN must be one of: ${allowedPlans.join(', ')}.`);
  }

  return { email, plan };
}

async function synchronizeUserPlan(prisma, email, plan) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({
      where: { email },
      select: { id: true, plan: true, subscription: { select: { activePlan: true } } },
    });
    if (!user) throw new PlanSyncUserNotFoundError();

    await transaction.user.update({ where: { id: user.id }, data: { plan } });
    const subscription = await transaction.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, activePlan: plan, status: 'ACTIVE' },
      update: { activePlan: plan, requestedPlan: null, status: 'ACTIVE' },
      select: { activePlan: true },
    });

    return {
      previousUserPlan: user.plan,
      previousSubscriptionPlan: user.subscription?.activePlan ?? null,
      activePlan: subscription.activePlan,
    };
  });
}

module.exports = { PlanSyncUserNotFoundError, parsePlanSyncEnvironment, synchronizeUserPlan };
