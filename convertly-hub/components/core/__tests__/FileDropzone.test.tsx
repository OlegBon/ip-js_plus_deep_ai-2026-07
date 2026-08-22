import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropzone from '../FileDropzone';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;
jest.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: { onDrop: (files: File[]) => void }) => ({
    getRootProps: () => ({}),
    getInputProps: () => ({
      type: 'file',
      'aria-label': 'Choose a file',
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => onDrop(Array.from(event.target.files ?? [])),
    }),
    isDragActive: false,
  }),
}));

describe('FileDropzone', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads a selected file and shows the success state', async () => {
    const user = userEvent.setup();
    const onUpload = jest.fn().mockResolvedValue(undefined);
    render(<FileDropzone title="Images" description="PNG only" accept={{ 'image/png': ['.png'] }} onUpload={onUpload} />);

    const file = new File(['content'], 'photo.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Choose a file'), file);

    expect(onUpload).toHaveBeenCalledWith(file);
    expect(await screen.findByText('photo.png uploaded successfully!')).toBeInTheDocument();
    expect(getMockToast().success).toHaveBeenCalledWith('photo.png uploaded successfully!');
  });

  it('shows the server error when upload fails', async () => {
    const user = userEvent.setup();
    render(<FileDropzone title="Documents" description="PDF only" accept={{ 'application/pdf': ['.pdf'] }} onUpload={jest.fn().mockRejectedValue(new Error('Network unavailable'))} />);

    await user.upload(screen.getByLabelText('Choose a file'), new File(['content'], 'report.pdf', { type: 'application/pdf' }));

    expect(await screen.findByText('report.pdf failed to upload.')).toBeInTheDocument();
    expect(screen.getByText('Network unavailable')).toBeInTheDocument();
    expect(getMockToast().error).toHaveBeenCalledWith('report.pdf failed to upload. Network unavailable');
  });
});
