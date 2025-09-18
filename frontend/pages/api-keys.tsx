import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { APIKeyManagement } from "@/components/settings/api-key-management";

export default function APIKeysPage() {
  return (
    <DashboardLayout activeTab="api-keys">
      <div className="p-8">
        <APIKeyManagement />
      </div>
    </DashboardLayout>
  );
}
