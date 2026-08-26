'use client';

import { FormEvent, useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';

type EditProfileModalProps = {
  isOpen: boolean;
  name: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
};

export default function EditProfileModal({ isOpen, name, onClose, onSave }: EditProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextName = String(new FormData(event.currentTarget).get('name') ?? '').trim();
    setIsSaving(true);
    try {
      await onSave(nextName);
    } finally {
      setIsSaving(false);
    }
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit profile">
      <form className="space-y-6 pt-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            defaultValue={name}
            minLength={1}
            maxLength={80}
            required
            autoComplete="name"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
