"use client";
import React, { useState } from 'react';
import EditProfileModal from './EditProfileModal';
import ConfirmationModal from '../core/ConfirmationModal';
import { Button } from '../ui/Button';
import { toast } from '@/lib/hooks/use-toast';

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
    toast.success('Your account deletion request has been submitted.');
    handleCloseConfirmModal();
  };

  const handleSaveProfile = (updatedUser: any) => {
    console.log('Profile updated:', updatedUser);
    toast.success('Your profile has been updated.');
    handleCloseEditModal();
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <Button
            onClick={handleOpenEditModal}
            className="w-full md:w-48"
          >
            Edit
          </Button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">Delete Account</p>
            <p className="text-sm text-gray-500">
              Note: Account deletion will be handled by an administrator.
            </p>
          </div>
          <Button 
            onClick={handleOpenConfirmModal}
            variant="secondary"
            className="w-full md:w-48"
          >
            Delete Account
          </Button>
        </div>
      </div>
      <EditProfileModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} onSave={handleSaveProfile} />
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
