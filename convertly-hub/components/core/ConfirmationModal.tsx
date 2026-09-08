'use client';
import React from 'react';
import Modal from '../ui/Modal';
import { Button, type ButtonProps } from '../ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: ButtonProps['variant'];
  isPending?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  isPending = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="pt-4">
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex items-center justify-end gap-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
