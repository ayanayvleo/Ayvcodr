import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { WorkflowList } from "@/components/dashboard/workflow-list"

export default function WorkflowsPage() {
  return (
    <AuthGuard>
      <DashboardLayout activeTab="workflows">
        <WorkflowList />
      </DashboardLayout>
    </AuthGuard>
  )
}
