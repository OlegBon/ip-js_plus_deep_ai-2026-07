"use client";

import { toast } from '@/lib/hooks/use-toast';
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
      toast.success(`${file.name} uploaded successfully!`);
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorMessage(message);
      toast.error(`${file.name} failed to upload. ${message}`);
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
                <p className="text-text-primary mt-2">{fileName} uploaded successfully!</p>
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
      className={`cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors
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
