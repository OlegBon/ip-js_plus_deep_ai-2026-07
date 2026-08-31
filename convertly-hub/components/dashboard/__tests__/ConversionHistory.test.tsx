import { render, screen } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
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
});
