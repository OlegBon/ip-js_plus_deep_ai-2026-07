'use client';

import { toast } from '@/lib/hooks/use-toast';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_LABEL } from '@/lib/files/upload-policy';

type UploadResult = { kind: 'converted' } | { kind: 'already-available' };

interface FileDropzoneProps {
  title: string;
  description: string;
  accept: Record<string, string[]>;
  onUpload: (file: File) => Promise<UploadResult | void>;
  getSuccessMessage?: (file: File) => string;
  maxSize?: number;
  maxSizeLabel?: string;
  disabled?: boolean;
}

type Status = 'idle' | 'uploading' | 'success' | 'already-available' | 'error';

const defaultSuccessMessage = (file: File) => `${file.name} uploaded successfully!`;
const SUCCESS_DISPLAY_MS = 5_000;

const FileDropzone = ({
  title,
  description,
  accept,
  onUpload,
  getSuccessMessage = defaultSuccessMessage,
  maxSize = MAX_UPLOAD_SIZE_BYTES,
  maxSizeLabel = MAX_UPLOAD_SIZE_LABEL,
  disabled = false,
}: FileDropzoneProps) => {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const uploadInProgress = useRef(false);

  useEffect(() => {
    if (status !== 'success' && status !== 'already-available') return;

    const resetTimer = window.setTimeout(() => {
      setStatus('idle');
      setProgress(0);
      setFileName(null);
      setSuccessMessage(null);
    }, SUCCESS_DISPLAY_MS);

    return () => window.clearTimeout(resetTimer);
  }, [status]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (uploadInProgress.current) return;

      const file = acceptedFiles[0];
      if (!file) return;

      uploadInProgress.current = true;
      setFileName(file.name);
      setStatus('uploading');
      setErrorMessage(null);
      setSuccessMessage(null);
      setProgress(0);

      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);

      try {
        const result = await onUpload(file);
        if (result?.kind === 'already-available') {
          const message = 'A matching conversion is already available in your Conversion History.';
          setStatus('already-available');
          setSuccessMessage(message);
          toast.success(message);
          return;
        }
        setProgress(100);
        setStatus('success');
        const message = getSuccessMessage(file);
        setSuccessMessage(message);
        toast.success(message);
      } catch (error) {
        setStatus('error');
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        setErrorMessage(message);
        toast.error(`${file.name} failed to upload. ${message}`);
      } finally {
        clearInterval(interval);
        uploadInProgress.current = false;
      }
    },
    [getSuccessMessage, onUpload],
  );

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      const rejection = fileRejections[0];
      if (!rejection) return;

      const message = rejection.errors.some(({ code }) => code === 'file-too-large')
        ? `File must be ${maxSizeLabel} or smaller.`
        : 'Unsupported file type. Choose JPG, PNG, DOCX, or PDF.';

      setFileName(rejection.file.name);
      setStatus('error');
      setErrorMessage(message);
      toast.error(`${rejection.file.name} was not selected. ${message}`);
    },
    [maxSizeLabel],
  );

  const isDropzoneDisabled =
    disabled || status === 'uploading' || status === 'success' || status === 'already-available';

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxSize,
    multiple: false,
    disabled: isDropzoneDisabled,
  });

  const renderContent = () => {
    switch (status) {
      case 'uploading':
        return (
          <div className="text-center">
            <p className="text-text-secondary mb-2">{fileName}</p>
            <div className="bg-border h-2.5 w-full rounded-full">
              <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-text-secondary mt-2 text-sm">{progress}%</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="text-success mx-auto h-12 w-12" />
            <p className="text-text-primary mt-2">{successMessage}</p>
          </div>
        );
      case 'already-available':
        return (
          <div className="text-center">
            <CheckCircle className="text-success mx-auto h-12 w-12" />
            <p className="text-text-primary mt-2">{successMessage}</p>
            <Link
              className="text-accent mt-4 inline-block text-sm hover:underline"
              href="/dashboard"
            >
              Open Dashboard
            </Link>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <AlertCircle className="text-error mx-auto h-12 w-12" />
            <p className="text-text-primary mt-2">{fileName} failed to upload.</p>
            <p className="text-text-secondary text-sm">{errorMessage}</p>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="text-center">
            <UploadCloud className="text-indigo-600 mx-auto h-12 w-12" />
            <p className="text-text-primary mt-2 font-semibold">{title}</p>
            <p className="text-text-secondary text-sm">{description}</p>
            <p className="text-accent mt-4 text-sm">Drag & drop a file or click to select</p>
          </div>
        );
    }
  };

  return (
    <div
      {...getRootProps()}
      aria-disabled={isDropzoneDisabled}
      className={`${isDropzoneDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} rounded-lg border-2 border-dashed p-8 transition-colors
        ${isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}
        ${status === 'success' && 'border-success'}
        ${status === 'already-available' && 'border-success'}
        ${status === 'error' && 'border-error'}`}
    >
      <input {...getInputProps()} />
      {renderContent()}
    </div>
  );
};

export default FileDropzone;
