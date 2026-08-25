"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/hooks/use-toast";
import type { PlanDefinition } from "@/lib/billing/plans";
import { formatPrice } from "@/lib/billing/plans";

type Props = { isOpen: boolean; onClose: () => void; plan: PlanDefinition | null };

export default function PaymentModal({ isOpen, onClose, plan }: Props) {
  const [billingName, setBillingName] = useState("");
  const [country, setCountry] = useState("UA");
  const [acceptedDemoTerms, setAcceptedDemoTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  if (!plan) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (billingName.trim().length < 2 || !/^[A-Z]{2}$/.test(country) || !acceptedDemoTerms) {
      setFieldError("Enter a billing name, a two-letter country code, and confirm the demo terms.");
      return;
    }
    setIsSubmitting(true);
    setFieldError("");
    try {
      const response = await fetch("/api/account/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: plan.id, billingName, country, acceptedDemoTerms }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) { setFieldError(payload.error ?? "Unable to save the demo request."); return; }
      toast.success(`${plan.name} was selected. This is a demo: no payment was collected and access has not changed.`);
      onClose();
    } catch {
      setFieldError("Unable to save the demo request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Demo checkout: ${plan.name}`}>
      <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
        <p className="text-sm text-gray-600">{plan.name} is {formatPrice(plan.priceCents)} per month. This form never asks for or stores payment-card data.</p>
        <div><label htmlFor="billing-name" className="text-sm font-medium text-gray-900">Billing name</label><Input id="billing-name" value={billingName} onChange={(event) => setBillingName(event.target.value)} autoComplete="name" required /></div>
        <div><label htmlFor="billing-country" className="text-sm font-medium text-gray-900">Country code</label><Input id="billing-country" value={country} onChange={(event) => setCountry(event.target.value.toUpperCase().slice(0, 2))} maxLength={2} autoComplete="country" required /></div>
        <label className="flex gap-2 text-sm text-gray-600"><input type="checkbox" checked={acceptedDemoTerms} onChange={(event) => setAcceptedDemoTerms(event.target.checked)} />I understand this is a demo request: no payment is collected and paid access is not activated.</label>
        {fieldError && <p role="alert" className="text-sm text-red-600">{fieldError}</p>}
        <div className="flex justify-end gap-4 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save demo request"}</Button></div>
      </form>
    </Modal>
  );
}
