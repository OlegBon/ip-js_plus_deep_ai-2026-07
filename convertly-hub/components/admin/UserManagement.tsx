"use client";

import React, { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active', lastLogin: '2026-08-15' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', status: 'Active', lastLogin: '2026-08-14' },
  { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', role: 'User', status: 'Inactive', lastLogin: '2026-07-20' },
  { id: 4, name: 'Alice Williams', email: 'alice.w@example.com', role: 'User', status: 'Active', lastLogin: '2026-08-15' },
  { id: 5, name: 'Bob Brown', email: 'bob.brown@example.com', role: 'User', status: 'Suspended', lastLogin: '2026-08-01' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  let statusClasses = '';
  switch (status) {
    case 'Active':
      statusClasses = 'bg-green-100 text-green-800';
      break;
    case 'Inactive':
      statusClasses = 'bg-yellow-100 text-yellow-800';
      break;
    case 'Suspended':
      statusClasses = 'bg-red-100 text-red-800';
      break;
    default:
      statusClasses = 'bg-gray-100 text-gray-800';
  }
  return <span className={`${baseClasses} ${statusClasses}`}>{status}</span>;
}

const UserManagement = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Last Login</th>
              <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  <div className="font-bold">{user.name}</div>
                  <div className="text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4">{user.lastLogin}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-500 hover:text-gray-800">
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
