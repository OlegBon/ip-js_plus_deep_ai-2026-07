import { render, screen } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversionHistory from '../ConversionHistory';

const activeConversion = {
  id: 'conversion-active',
  sourceFileName: 'holiday.jpg',
  sourceMimeType: 'image/jpeg',
  targetFormat: 'png',
  status: 'COMPLETED',
  storageKey: 'users/user/conversions/conversion-active/holiday.png',
  expiresAt: '2030-01-01T00:00:00.000Z',
};

const expiredConversion = {
  id: 'conversion-expired',
  sourceFileName: 'archive.png',
  sourceMimeType: 'image/png',
  targetFormat: 'jpg',
  status: 'COMPLETED',
  storageKey: 'users/user/conversions/conversion-expired/archive.jpg',
  expiresAt: '2020-01-01T00:00:00.000Z',
};

describe('ConversionHistory', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ conversions: [activeConversion, expiredConversion] }),
    }) as jest.Mock;
  });

  afterEach(() => jest.clearAllMocks());

  it('links only currently available completed files to the protected download endpoint', async () => {
    render(<ConversionHistory />);

    const activeFile = await screen.findByRole('link', { name: 'holiday.jpg' });
    expect(activeFile).toHaveAttribute(
      'href',
      '/api/account/conversions/conversion-active/download',
    );
    expect(screen.getByText('archive.png').closest('a')).toBeNull();
  });

  it('shows the source and target formats for each conversion', async () => {
    render(<ConversionHistory />);

    await waitFor(() => expect(screen.getByText('JPG → PNG')).toBeInTheDocument());
    expect(screen.getByText('PNG → JPG')).toBeInTheDocument();
  });

  it('loads the next and previous cursor pages', async () => {
    const user = userEvent.setup();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversions: [activeConversion], nextCursor: 'cursor-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversions: [expiredConversion], nextCursor: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversions: [activeConversion], nextCursor: 'cursor-1' }),
      }) as jest.Mock;

    render(<ConversionHistory />);
    await screen.findByText('holiday.jpg');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('archive.png')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/account/conversions?cursor=cursor-1',
      expect.any(Object),
    );
    expect(screen.getByText('Page 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('holiday.jpg')).toBeInTheDocument();
  });
});
