"use client";
import React from 'react';
import { toast } from '@/lib/hooks/use-toast';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; name: string; email: string; role: string; } | null;
  onSave: (user: { id: number; name: string; email: string; role: string }) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSave }) => {
  if (!user) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedUser = {
      id: user.id,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      role: formData.get('role') as string,
    };
    onSave(updatedUser);
    toast.success(`User ${updatedUser.name} has been updated.`);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
      <form className="pt-4" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={user.name}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user.email}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="role">
            Role
          </label>
          <select 
            id="role"
            name="role"
            defaultValue={user.role}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Admin</option>
            <option>User</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
            New Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter new password (optional)"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
