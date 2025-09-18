import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { CreateAPIButton } from "@/components/dashboard/dashboard-layout";

export default function APIEndpointsPage() {
  return (
    <DashboardLayout activeTab="api-endpoints">
      <div className="p-8">
        <CreateAPIButton />
        <div className="mt-8 text-green-100">API endpoint management will go here.</div>
      </div>
    </DashboardLayout>
  );
}
