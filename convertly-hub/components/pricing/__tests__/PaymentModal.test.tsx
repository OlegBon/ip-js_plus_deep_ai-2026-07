import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentModal from '../PaymentModal';

describe('PaymentModal', () => {
  const tier = { name: 'Pro', priceMonthly: '$19' };

  it('is hidden without a selected tier and closes when payment succeeds', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    const { rerender } = render(<PaymentModal isOpen onClose={onClose} tier={null} />);
    expect(screen.queryByText(/Payment for/)).not.toBeInTheDocument();

    rerender(<PaymentModal isOpen onClose={onClose} tier={tier} />);
    expect(screen.getByRole('heading', { name: 'Payment for Pro Plan' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Proceed to Payment' }));

    expect(alertSpy).toHaveBeenCalledWith('Payment for Pro plan successful!');
    expect(onClose).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });
});
