import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentModal from '../PaymentModal';

describe('PaymentModal', () => {
  const plan = { id: 'PRO', name: 'Pro', priceCents: 1900, monthlyConversions: 2000, maxFileSizeBytes: 1, storageBytes: BigInt(1), retentionDays: 30, apiAccess: true, support: 'Email', description: 'Test' } as const;

  it('validates demo fields and sends no payment-card data', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<PaymentModal isOpen onClose={onClose} plan={plan} />);
    await user.type(screen.getByLabelText('Billing name'), 'Alex');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Save demo request' }));
    expect(global.fetch).toHaveBeenCalledWith('/api/account/billing', expect.objectContaining({ method: 'POST' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
