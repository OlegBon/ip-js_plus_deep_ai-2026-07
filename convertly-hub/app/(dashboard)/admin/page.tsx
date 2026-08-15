import React from 'react';
import SystemMonitoring from '@/components/admin/SystemMonitoring';
import UserManagement from '@/components/admin/UserManagement';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">System Monitoring</h2>
        <SystemMonitoring />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <UserManagement />
      </section>
    </div>
  );
}
