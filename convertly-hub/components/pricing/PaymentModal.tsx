"use client";
import React from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: {
    name: string;
    priceMonthly: string;
  } | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, tier }) => {
  if (!tier) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Payment for ${tier.name} Plan`}>
      <div className="pt-4 space-y-4">
        <p>You have selected the <strong>{tier.name}</strong> plan at <strong>{tier.priceMonthly}/month</strong>.</p>
        
        <div className="space-y-2">
            <h3 className="font-semibold">How to pay:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                <li>Click the "Proceed to Payment" button below.</li>
                <li>You will be redirected to our secure payment partner.</li>
                <li>Enter your payment details.</li>
                <li>Once payment is complete, your plan will be activated.</li>
            </ol>
        </div>

        <p className="text-xs text-gray-500">
            For now, this is a mock payment flow. Clicking the button below will simulate a successful payment.
        </p>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
                alert(`Payment for ${tier.name} plan successful!`);
                onClose();
            }}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
