
import * as React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className, title }) => {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={twMerge(clsx("relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl", className))}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 rounded-full p-1 transition-colors hover:bg-gray-100"
            >
                <X size={24} />
            </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
