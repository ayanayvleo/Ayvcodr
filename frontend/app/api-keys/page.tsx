"use client";
export const dynamic = "force-dynamic";
import { AuthGuard } from "@/components/auth/auth-guard";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { APIKeyManagement } from "@/components/settings/api-key-management";

export default function APIKeysPage() {
  return (
    <AuthGuard>
      <DashboardLayout activeTab="api keys">
        <APIKeyManagement />
      </DashboardLayout>
    </AuthGuard>
  );
}
