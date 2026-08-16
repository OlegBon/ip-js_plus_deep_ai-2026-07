'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import EditProfileModal from './EditProfileModal';
import ConfirmationModal from '../core/ConfirmationModal';
import { Button } from '../ui/Button';
import { toast } from '@/lib/hooks/use-toast';

const UserProfile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Mock user data - unverified
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    emailVerified: false,
    telegramId: 'johndoe_tg',
    telegramVerified: false,
  };

  // Mock user data - verified
  /*
  const user = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    emailVerified: true,
    telegramId: 'janedoe_tg',
    telegramVerified: true,
  };
  */

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

  const handleSendConfirmation = (type: 'email' | 'telegram') => {
    // TODO: Implement actual confirmation sending logic
    toast.success(`A new confirmation link has been sent to your ${type}.`);
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">{user.name}</p>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">{user.email}</p>
              {user.emailVerified ? (
                <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full">
                  Verified
                </span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-800 font-medium px-2.5 py-0.5 rounded-full">
                  Unverified
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {!user.emailVerified && (
              <Button
                onClick={() => handleSendConfirmation('email')}
                variant="secondary"
                className="w-full md:w-[150px]"
              >
                Confirm Email
              </Button>
            )}
            <Button onClick={handleOpenEditModal} className="w-full md:w-[150px]">
              Edit
            </Button>
          </div>
        </div>

        <div className="border-t border-gray-200"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">Telegram Account</p>
            {user.telegramId ? (
              <div className="flex items-center gap-2">
                <p className="text-gray-600">@{user.telegramId}</p>
                {user.telegramVerified ? (
                  <span className="text-xs bg-green-100 text-green-800 font-medium px-2.5 py-0.5 rounded-full">
                    Verified
                  </span>
                ) : (
                  <span className="text-xs bg-yellow-100 text-yellow-800 font-medium px-2.5 py-0.5 rounded-full">
                    Unverified
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Not connected. Add your Telegram account by editing your profile.
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {user.telegramId && !user.telegramVerified && (
              <Button
                onClick={() => handleSendConfirmation('telegram')}
                variant="secondary"
                className="w-full md:w-[150px]"
              >
                Confirm Telegram
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">Reset Password</p>
            <p className="text-sm text-gray-500">Change your password.</p>
          </div>
          <div className="text-sm flex items-center">
            <Link
              href="/password-reset"
              className="text-accent hover:text-accent-hover font-medium whitespace-nowrap"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-200"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full">
            <p className="text-lg font-semibold">Delete Account</p>
            <p className="text-sm text-gray-500">
              Note: Account deletion will be handled by an administrator.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              onClick={handleOpenConfirmModal}
              variant="secondary"
              className="w-full md:w-[150px]"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveProfile}
        user={user}
      />
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
