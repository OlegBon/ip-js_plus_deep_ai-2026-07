"use client";

import React from 'react';
import { Users, FileStack, AlertTriangle, Database } from 'lucide-react';

const mockSystemStats = {
  activeUsers: { value: 125, label: 'Active Users', icon: Users },
  totalConversions: { value: 5432, label: 'Total Conversions', icon: FileStack },
  errorRate: { value: '1.2%', label: 'Error Rate', icon: AlertTriangle },
  dbStatus: { value: 'Healthy', label: 'Database Status', icon: Database },
};

const StatCard = ({ stat }: { stat: { value: string | number; label: string; icon: React.ElementType } }) => {
  const Icon = stat.icon;
  return (
    <div className="p-6 bg-white rounded-lg shadow-md flex items-center space-x-4">
      <div className="p-3 bg-indigo-100 rounded-full">
        <Icon className="h-6 w-6 text-indigo-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
      </div>
    </div>
  );
};


const SystemMonitoring = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard stat={mockSystemStats.activeUsers} />
      <StatCard stat={mockSystemStats.totalConversions} />
      <StatCard stat={mockSystemStats.errorRate} />
      <StatCard stat={mockSystemStats.dbStatus} />
    </div>
  );
};

export default SystemMonitoring;
