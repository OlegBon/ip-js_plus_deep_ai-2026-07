import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropzone from '../FileDropzone';

jest.mock('@/lib/hooks/use-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
const getMockToast = () => jest.requireMock('@/lib/hooks/use-toast').toast;
jest.mock('react-dropzone', () => ({
  useDropzone: ({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
  }: {
    onDrop: (files: File[]) => void;
    onDropRejected: (rejections: { file: File; errors: { code: string }[] }[]) => void;
    accept: Record<string, string[]>;
    maxSize: number;
  }) => ({
    getRootProps: () => ({}),
    getInputProps: () => ({
      type: 'file',
      'aria-label': 'Choose a file',
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > maxSize) {
          onDropRejected([{ file, errors: [{ code: 'file-too-large' }] }]);
          return;
        }
        if (!Object.hasOwn(accept, file.type)) {
          onDropRejected([{ file, errors: [{ code: 'file-invalid-type' }] }]);
          return;
        }
        onDrop([file]);
      },
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

  it('rejects files over the configured size before upload', async () => {
    const user = userEvent.setup();
    const onUpload = jest.fn();
    render(<FileDropzone title="Images" description="PNG only" accept={{ 'image/png': ['.png'] }} onUpload={onUpload} maxSize={3} maxSizeLabel="3 B" />);

    await user.upload(screen.getByLabelText('Choose a file'), new File(['four'], 'large.png', { type: 'image/png' }));

    expect(onUpload).not.toHaveBeenCalled();
    expect(await screen.findByText('File must be 3 B or smaller.')).toBeInTheDocument();
  });

  it('rejects unsupported file types before upload', async () => {
    const user = userEvent.setup();
    const onUpload = jest.fn();
    render(<FileDropzone title="Images" description="PNG only" accept={{ 'image/png': ['.png'] }} onUpload={onUpload} />);

    await user.upload(screen.getByLabelText('Choose a file'), new File(['content'], 'archive.zip', { type: 'application/zip' }));

    expect(onUpload).not.toHaveBeenCalled();
    expect(await screen.findByText('Unsupported file type. Choose JPG, PNG, DOCX, or PDF.')).toBeInTheDocument();
  });
});
