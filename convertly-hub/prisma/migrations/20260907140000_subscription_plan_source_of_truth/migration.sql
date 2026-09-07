-- Subscription.activePlan becomes the only source of truth for a user's plan.
-- Existing subscriptions win during reconciliation; legacy User.plan is used only
-- to initialise subscriptions that did not exist before the migration.
INSERT INTO "Subscription" (
    "id",
    "userId",
    "activePlan",
    "requestedPlan",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    u."id",
    u."plan",
    NULL,
    'ACTIVE'::"SubscriptionStatus",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u."id"
WHERE s."userId" IS NULL;

ALTER TABLE "User" DROP COLUMN "plan";
