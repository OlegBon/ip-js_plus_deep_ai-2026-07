'use client';

import { useCallback, useState } from 'react';
import SystemMonitoring from '@/components/admin/SystemMonitoring';
import UserManagement from '@/components/admin/UserManagement';
import AccountDeletionRequests from '@/components/admin/AccountDeletionRequests';

export default function AdminPage() {
  const [adminDataVersion, setAdminDataVersion] = useState(0);
  const refreshAdminData = useCallback(() => {
    setAdminDataVersion((version) => version + 1);
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <section>
        <h2 className="text-2xl font-semibold mb-4">System Monitoring</h2>
        <SystemMonitoring refreshKey={adminDataVersion} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">User Management</h2>
        <UserManagement refreshKey={adminDataVersion} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Account Deletion Requests</h2>
        <AccountDeletionRequests onDeletionCompleted={refreshAdminData} />
      </section>
    </div>
  );
}
