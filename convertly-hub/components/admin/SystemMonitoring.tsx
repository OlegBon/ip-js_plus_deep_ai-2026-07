'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Database,
  FileStack,
  HardDrive,
  LoaderCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

type Metrics = {
  activeUsers: number;
  activeUsersWindowDays: number;
  totalConversions: number;
  failedConversions: number;
  errorRate: number;
  services: { database: 'up' | 'down'; gotenberg: 'up' | 'down'; storage: 'up' | 'down' };
};

export default function SystemMonitoring() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadMetrics = useCallback(async (signal?: AbortSignal) => {
    setStatus('loading');
    try {
      const response = await fetch('/api/admin/metrics', { signal });
      if (!response.ok) throw new Error('Unable to load system metrics.');
      setMetrics((await response.json()) as Metrics);
      setStatus('ready');
    } catch {
      if (!signal?.aborted) setStatus('error');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadMetrics(controller.signal);
    return () => controller.abort();
  }, [loadMetrics]);

  if (status === 'loading' && !metrics) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-white p-6 shadow-md" role="status">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading system metrics…
      </div>
    );
  }

  if (status === 'error' && !metrics) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md" role="alert">
        <p>Unable to load system metrics.</p>
        <Button className="mt-3" variant="secondary" onClick={() => void loadMetrics()}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  const cards = [
    {
      value: metrics.activeUsers,
      label: `Active users (${metrics.activeUsersWindowDays} days)`,
      icon: Users,
    },
    { value: metrics.totalConversions, label: 'Total conversions', icon: FileStack },
    {
      value: `${metrics.errorRate}%`,
      label: `${metrics.failedConversions} failed conversions`,
      icon: AlertTriangle,
    },
    {
      value: metrics.services.database === 'up' ? 'Healthy' : 'Unavailable',
      label: 'Database status',
      icon: Database,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center space-x-4 rounded-lg bg-white p-6 shadow-md"
            >
              <div className="rounded-full bg-indigo-100 p-3">
                <Icon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-gray-500">
        <HardDrive size={16} /> Storage: {metrics.services.storage}; Gotenberg:{' '}
        {metrics.services.gotenberg}
      </p>
      {status === 'error' && (
        <div className="mt-3 flex items-center gap-3 text-sm text-red-700" role="alert">
          <span>Unable to refresh system metrics. Showing the last available values.</span>
          <Button variant="link" size="sm" onClick={() => void loadMetrics()}>
            Retry
          </Button>
        </div>
      )}
    </>
  );
}
