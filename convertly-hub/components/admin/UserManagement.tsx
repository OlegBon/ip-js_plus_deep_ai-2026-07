"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import Search from '../ui/Search';
import { MoreVertical, ArrowUp, ArrowDown } from 'lucide-react';
import EditUserModal from './EditUserModal';
import ConfirmationModal from '../core/ConfirmationModal';
import Pagination from '../ui/Pagination';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  status: 'Active' | 'Inactive' | 'Suspended';
  lastLogin: string;
};

const mockUsers: User[] = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active', lastLogin: '2026-08-15' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', status: 'Active', lastLogin: '2026-08-14' },
    { id: 3, name: 'Peter Jones', email: 'peter.jones@example.com', role: 'User', status: 'Inactive', lastLogin: '2026-07-20' },
    { id: 4, name: 'Alice Williams', email: 'alice.w@example.com', role: 'User', status: 'Active', lastLogin: '2026-08-15' },
    { id: 5, name: 'Bob Brown', email: 'bob.brown@example.com', role: 'User', status: 'Suspended', lastLogin: '2026-08-01' },
    { id: 6, name: 'Charlie Davis', email: 'charlie.d@example.com', role: 'User', status: 'Active', lastLogin: '2026-08-16' },
    { id: 7, name: 'Diana Miller', email: 'diana.m@example.com', role: 'User', status: 'Inactive', lastLogin: '2026-08-02' },
];

const ITEMS_PER_PAGE = 5;

const StatusBadge = ({ status }: { status: string }) => {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  let statusClasses = '';
  switch (status) {
    case 'Active': statusClasses = 'bg-green-100 text-green-800'; break;
    case 'Inactive': statusClasses = 'bg-yellow-100 text-yellow-800'; break;
    case 'Suspended': statusClasses = 'bg-red-100 text-red-800'; break;
    default: statusClasses = 'bg-gray-100 text-gray-800';
  }
  return <span className={`${baseClasses} ${statusClasses}`}>{status}</span>;
}

type SortConfig = { key: keyof User; direction: 'ascending' | 'descending'; } | null;

const UserManagement = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveActionMenu(null);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveActionMenu(null);
      }
    };

    if (activeActionMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [activeActionMenu]);

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

  const sortedUsers = useMemo(() => {
    let sortableUsers = [...filteredUsers];
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);
  
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);

  const requestSort = (key: keyof User) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setEditModalOpen(true);
    setActiveActionMenu(null);
  };

  const handleDeleteClick = (user: User) => {
    setDeletingUser(user);
    setConfirmModalOpen(true);
    setActiveActionMenu(null);
  };
  
  const confirmDelete = () => {
    if (deletingUser) {
      setUsers(users.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
    }
    setConfirmModalOpen(false);
  };

  const renderSortArrow = (key: keyof User) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
    }
    return null;
  };

  return (
    <>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <Search
            placeholder="Search users..."
            onSearch={setSearchTerm}
            className="w-full max-w-xs"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-1">Name {renderSortArrow('name')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('role')}>
                   <div className="flex items-center gap-1">Role {renderSortArrow('role')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                   <div className="flex items-center gap-1">Status {renderSortArrow('status')}</div>
                </th>
                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('lastLogin')}>
                   <div className="flex items-center gap-1">Last Login {renderSortArrow('lastLogin')}</div>
                </th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div className="font-bold">{user.name}</div>
                    <div className="text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">{user.role}</td>
                  <td className="px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="px-6 py-4">{user.lastLogin}</td>
                  <td className="px-6 py-4 text-right relative">
                    <Button variant="ghost" size="icon" onClick={() => setActiveActionMenu(activeActionMenu === user.id ? null : user.id)}>
                      <MoreVertical size={20} />
                    </Button>
                    {activeActionMenu === user.id && (
                      <div ref={actionMenuRef} className="absolute right-0 mt-2 w-28 bg-white rounded-md shadow-lg z-10 border">
                        <Button variant="ghost" onClick={() => handleEditClick(user)} className="w-full justify-start">Edit</Button>
                        <Button variant="ghost" onClick={() => handleDeleteClick(user)} className="w-full justify-start text-red-600 hover:text-red-700">Delete</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        user={editingUser}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
      />
    </>
  );
};

export default UserManagement;
