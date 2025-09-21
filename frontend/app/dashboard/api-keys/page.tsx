"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { APIKeyManagement } from "@/components/settings/api-key-management";

export default function APIKeysPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">API Keys</h1>
          <APIKeyManagement />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
