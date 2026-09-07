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
      select: { id: true, subscription: { select: { activePlan: true } } },
    });
    if (!user) throw new PlanSyncUserNotFoundError();

    if (!user.subscription) throw new Error('The user is missing a subscription. Run the subscription audit before plan sync.');
    const subscription = await transaction.subscription.update({
      where: { userId: user.id },
      data: { activePlan: plan, requestedPlan: null, status: 'ACTIVE' },
      select: { activePlan: true },
    });

    return {
      previousActivePlan: user.subscription.activePlan,
      activePlan: subscription.activePlan,
    };
  });
}

module.exports = { PlanSyncUserNotFoundError, parsePlanSyncEnvironment, synchronizeUserPlan };
