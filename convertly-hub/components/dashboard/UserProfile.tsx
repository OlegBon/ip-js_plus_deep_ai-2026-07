"use client";
import React, { useState } from 'react';
import EditProfileModal from './EditProfileModal';
import ConfirmationModal from '../core/ConfirmationModal';

const UserProfile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  const handleOpenEditModal = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);

  const handleOpenConfirmModal = () => setIsConfirmModalOpen(true);
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleDeleteAccount = () => {
    console.log('Account deletion confirmed.');
    handleCloseConfirmModal();
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <button
            onClick={handleOpenEditModal}
            className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-900 w-full md:w-48 flex justify-center"
          >
            Edit
          </button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">Delete Account</p>
            <p className="text-sm text-gray-500">
              Note: Account deletion will be handled by an administrator.
            </p>
          </div>
          <button 
            onClick={handleOpenConfirmModal}
            className="text-text-primary border-border rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 w-full md:w-48 flex justify-center"
          >
            Delete Account
          </button>
        </div>
      </div>
      <EditProfileModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
      />
    </>
  );
};

export default UserProfile;
