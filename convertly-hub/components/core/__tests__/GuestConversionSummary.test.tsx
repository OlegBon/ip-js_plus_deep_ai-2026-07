import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GuestConversionSummary from '../GuestConversionSummary';

const result = {
  id: 'guest-result-1',
  blob: new Blob(['converted file']),
  fileName: 'holiday.png',
  expiresAt: Date.UTC(2030, 0, 1, 0, 10),
};

describe('GuestConversionSummary', () => {
  it('shows remaining monthly allowances, reset date, and active browser downloads', async () => {
    const onDownload = jest.fn();
    const user = userEvent.setup();
    render(
      <GuestConversionSummary
        remainingImage={2}
        remainingDocument={1}
        resetsAt="2030-02-01T00:00:00.000Z"
        results={[result]}
        now={Date.UTC(2030, 0, 1)}
        onDownload={onDownload}
      />,
    );

    expect(screen.getByText('Images: 2 of 3 remaining this month')).toBeInTheDocument();
    expect(screen.getByText('Documents: 1 of 2 remaining this month')).toBeInTheDocument();
    expect(screen.getByText('Allowance resets on February 1, 2030.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'holiday.png' })).toBeInTheDocument();
    expect(screen.getByText('Available for 10 min')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'holiday.png' }));
    expect(onDownload).toHaveBeenCalledWith(result);
  });

  it('explains where future guest downloads appear', () => {
    render(
      <GuestConversionSummary
        remainingImage={3}
        remainingDocument={2}
        resetsAt={null}
        results={[]}
        now={Date.now()}
        onDownload={jest.fn()}
      />,
    );

    expect(screen.getByText('Guest conversions (0)')).toBeInTheDocument();
    expect(
      screen.getByText('Converted guest files will appear here for 10 minutes in this browser.'),
    ).toBeInTheDocument();
  });

  it('keeps an expired file name visible but not downloadable', () => {
    render(
      <GuestConversionSummary
        remainingImage={0}
        remainingDocument={0}
        resetsAt={null}
        results={[{ ...result, blob: null }]}
        now={Date.UTC(2030, 0, 1, 0, 10)}
        onDownload={jest.fn()}
      />,
    );

    expect(screen.getByText('holiday.png')).toBeInTheDocument();
    expect(screen.getByText('Unavailable — download window expired.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'holiday.png' })).not.toBeInTheDocument();
  });
});
