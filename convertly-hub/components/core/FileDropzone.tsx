"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { File as FileIcon, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
  title: string;
  description: string;
  accept: Record<string, string[]>;
  onUpload: (file: File) => Promise<void>;
}

type Status = 'idle' | 'uploading' | 'success' | 'error';

const FileDropzone = ({ title, description, accept, onUpload }: FileDropzoneProps) => {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    setStatus('uploading');
    setErrorMessage(null);
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
      await onUpload(file);
      setProgress(100);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
        clearInterval(interval);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
  });
  
  const renderContent = () => {
    switch (status) {
        case 'uploading':
        return (
            <div className="text-center">
                <p className="text-text-secondary mb-2">{fileName}</p>
                <div className="w-full bg-border rounded-full h-2.5">
                    <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-text-secondary mt-2">{progress}%</p>
            </div>
        );
        case 'success':
        return (
            <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-success" />
                <p className="mt-2 text-text-primary">{fileName} uploaded successfully!</p>
            </div>
        );
        case 'error':
        return (
            <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-error" />
                <p className="mt-2 text-text-primary">{fileName} failed to upload.</p>
                <p className="text-sm text-text-secondary">{errorMessage}</p>
            </div>
        );
        case 'idle':
        default:
        return (
            <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-text-secondary" />
                <p className="mt-2 text-text-primary font-semibold">{title}</p>
                <p className="text-sm text-text-secondary">{description}</p>
                <p className="text-sm text-accent mt-4">Drag & drop a file or click to select</p>
            </div>
        );
    }
  };

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer
        ${isDragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'}
        ${status === 'success' && 'border-success'}
        ${status === 'error' && 'border-error'}`}
    >
      <input {...getInputProps()} />
      {renderContent()}
    </div>
  );
};

export default FileDropzone;
