"use client";

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

// Mock data for the user's current plan and usage
const userPlan = {
  name: 'Pro',
  priceMonthly: '$19',
  features: [
    '50 projects',
    'Up to 10,000 tasks',
    '100GB of storage',
    'Priority email support',
    'Advanced analytics',
  ],
  usage: {
    tasks: {
      used: 4250,
      limit: 10000,
    },
    storage: {
      used: 35.5,
      limit: 100,
      unit: 'GB',
    },
  },
};

const UsageBar = ({ used, limit, unit }: { used: number, limit: number, unit?: string }) => {
  const percentage = (used / limit) * 100;
  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-gray-600">
        <span>{`${used.toLocaleString()} / ${limit.toLocaleString()}${unit ? ` ${unit}`: ''}`}</span>
        <span>{percentage.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div
          className="bg-indigo-600 h-2.5 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const UserPlan = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Plan Details */}
        <div className="md:col-span-1">
          <h3 id="tier-pro" className="text-lg font-semibold leading-7 text-gray-900">
            {userPlan.name} Plan
          </h3>
          <p className="mt-2 flex items-baseline gap-x-2">
            <span className="text-4xl font-bold tracking-tight text-gray-900">{userPlan.priceMonthly}</span>
            <span className="text-base text-gray-500">/month</span>
          </p>
          <p className="mt-4 text-sm text-gray-600">Your current subscription.</p>
           <a
                href="/pricing"
                className='mt-4 block rounded-md py-2 px-3 text-center text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50'
              >
                Change Plan
              </a>
        </div>

        {/* Usage and Limits */}
        <div className="md:col-span-2 space-y-6">
            <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2">Monthly Usage</h4>
                 <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-800">Tasks</p>
                        <UsageBar used={userPlan.usage.tasks.used} limit={userPlan.usage.tasks.limit} />
                    </div>
                     <div>
                        <p className="text-sm font-medium text-gray-800">Storage</p>
                        <UsageBar used={userPlan.usage.storage.used} limit={userPlan.usage.storage.limit} unit={userPlan.usage.storage.unit} />
                    </div>
                </div>
            </div>
             <div>
                <h4 className="text-base font-semibold text-gray-800 mb-2">Included Features</h4>
                <ul role="list" className="space-y-3 text-sm leading-6 text-gray-600">
                    {userPlan.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                        <CheckIcon className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                        {feature}
                    </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserPlan;
