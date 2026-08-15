"use client";
import React, { useEffect } from 'react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: { id: number; name: string; email: string; role: string; } | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Edit User</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
              Name
            </label>
            <input
              type="text"
              id="name"
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
              placeholder="Enter new password (optional)"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="text-text-primary border-border rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-900"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
