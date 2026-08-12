import React from "react";
import UserProfile from "@/components/dashboard/UserProfile";
import ApiKeyManager from "@/components/dashboard/ApiKeyManager";
import PrivacySettings from "@/components/dashboard/PrivacySettings";
import ConversionHistory from "@/components/dashboard/ConversionHistory";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Account</h1>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">User Profile</h2>
        <UserProfile />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">API Key Management</h2>
        <ApiKeyManager />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>
        <PrivacySettings />
      </section>
      
      <section>
        <h2 className="text-2xl font-semibold mb-4">Conversion History</h2>
        <ConversionHistory />
      </section>
    </div>
  );
}
