"use client";
import React from 'react';
import { LogOut } from 'lucide-react';

const UserProfile = () => {
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  const handleLogout = () => {
    // In a real app, this would handle the logout logic
    console.log('User logged out');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex md:items-center justify-center w-full md:w-48 px-4 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          aria-label="Log Out"
        >
          <LogOut size={20} className="mr-2" />
          Log Out
        </button>
      </div>

      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full">
          <p className="text-lg font-semibold">Delete Account</p>
          <p className="text-sm text-gray-500">
            Note: Account deletion will be handled by an administrator.
          </p>
        </div>
        <button className="flex md:items-center justify-center w-full md:w-48 px-4 py-2 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
