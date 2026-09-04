import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestConversionSummary from '../GuestConversionSummary';

describe('GuestConversionSummary support code', () => {
  it('renders and copies the guest support code', async () => {
    const user = userEvent.setup();

    render(
      <GuestConversionSummary
        remainingImage={2}
        remainingDocument={2}
        resetsAt="2026-10-01T00:00:00.000Z"
        supportCode="GUEST-1234-ABCD-5678-EF90"
        results={[]}
        now={Date.now()}
        onDownload={jest.fn()}
      />,
    );

    expect(screen.getByText('Guest support code')).toBeVisible();
    expect(screen.getByText('GUEST-1234-ABCD-5678-EF90')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(screen.getByRole('button', { name: 'Copied' })).toBeVisible();
  });
});
