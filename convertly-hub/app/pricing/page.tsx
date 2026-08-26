"use client";

import { Suspense, useState } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import PaymentModal from "@/components/pricing/PaymentModal";
import { formatBytes, formatPrice, getPlanDefinition, isSubscriptionPlan, PUBLIC_PLANS, type PlanDefinition } from "@/lib/billing/plans";

function planFeatures(plan: PlanDefinition) {
  return [
    `${plan.monthlyConversions.toLocaleString("en-US")} successful conversions / month`,
    `Files up to ${formatBytes(plan.maxFileSizeBytes)}`,
    `${formatBytes(plan.storageBytes)} result storage`,
    plan.retentionDays === null ? "No automatic deletion" : `${plan.retentionDays}-day result retention`,
    plan.apiAccess ? "API access" : "Dashboard conversions only",
    plan.support,
  ];
}

function PricingContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<PlanDefinition | null>(null);
  const checkoutPlan = searchParams.get("checkout");

  const requestedPlan = status === "authenticated" && isSubscriptionPlan(checkoutPlan)
    ? getPlanDefinition(checkoutPlan)
    : null;

  const handlePlanSelection = (plan: PlanDefinition) => {
    if (status !== "authenticated") {
      router.push(`/register?plan=${plan.id}`);
      return;
    }
    setSelectedPlan(plan);
  };

  const closeModal = () => {
    setSelectedPlan(null);
    if (checkoutPlan) router.replace("/pricing");
  };

  return (
    <>
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Plans for file conversion</h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">Every plan starts with an account, private history, and transparent file retention.</p>
          </div>
          <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-stretch gap-6 lg:max-w-none lg:grid-cols-4">
            {PUBLIC_PLANS.map((plan) => (
              <section key={plan.id} className={`flex h-full flex-col rounded-lg p-8 ring-1 ring-gray-200 ${plan.isPopular ? "relative bg-white shadow-lg" : "bg-white"}`} aria-labelledby={`plan-${plan.id}`}>
                <h2 id={`plan-${plan.id}`} className="text-base font-semibold leading-7 text-gray-900">{plan.name}</h2>
                <p className="mt-4 flex items-baseline gap-x-2"><span className="text-5xl font-bold tracking-tight text-gray-900">{formatPrice(plan.priceCents)}</span><span className="text-base text-gray-500">/month</span></p>
                <p className="mt-6 text-base leading-7 text-gray-600">{plan.description}</p>
                <ul className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                  {planFeatures(plan).map((feature) => <li key={feature} className="flex gap-x-3"><CheckIcon className="h-6 w-5 flex-none text-gray-900" aria-hidden="true" />{feature}</li>)}
                </ul>
                <div className="mt-auto pt-8">
                  <Button onClick={() => handlePlanSelection(plan)} variant={plan.isPopular ? "primary" : "outline"} className="w-full">
                    {plan.id === "FREE" && status !== "authenticated" ? "Create free account" : "Choose plan"}
                  </Button>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      <PaymentModal isOpen={selectedPlan !== null || requestedPlan !== null} onClose={closeModal} plan={selectedPlan ?? requestedPlan} />
    </>
  );
}

export default function PricingPage() {
  return <Suspense fallback={<div className="flex min-h-96 items-center justify-center">Loading plans…</div>}><PricingContent /></Suspense>;
}
