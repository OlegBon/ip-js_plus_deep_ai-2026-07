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
      json: async () => ({ conversions: [activeConversion, expiredConversion], total: 2 }),
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
        json: async () => ({ conversions: [activeConversion], nextCursor: 'cursor-1', total: 11 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversions: [expiredConversion], nextCursor: null, total: 11 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversions: [activeConversion], nextCursor: 'cursor-1', total: 11 }),
      }) as jest.Mock;

    render(<ConversionHistory />);
    await screen.findByText('holiday.jpg');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('archive.png')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/account/conversions?sort=createdAt&direction=desc&cursor=cursor-1',
      expect.any(Object),
    );
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('holiday.jpg')).toBeInTheDocument();
  });

  it('applies a live file-name search and resets pagination when sorting changes', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ conversions: [activeConversion], nextCursor: null, total: 1 }),
    }) as jest.Mock;

    render(<ConversionHistory />);
    await screen.findByText('holiday.jpg');
    await user.type(screen.getByRole('textbox', { name: 'Search by file name' }), 'holiday');

    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/account/conversions?sort=createdAt&direction=desc&search=holiday',
        expect.any(Object),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Status' }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/account/conversions?sort=status&direction=desc&search=holiday',
        expect.any(Object),
      ),
    );
  });

  it('clears the visible and submitted file-name search', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ conversions: [activeConversion], nextCursor: null, total: 1 }),
    }) as jest.Mock;

    render(<ConversionHistory />);
    const searchInput = await screen.findByRole('textbox', { name: 'Search by file name' });
    await user.type(searchInput, 'holiday');
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/account/conversions?sort=createdAt&direction=desc&search=holiday',
        expect.any(Object),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(searchInput).toHaveValue('');
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/account/conversions?sort=createdAt&direction=desc',
        expect.any(Object),
      ),
    );
  });
});
