import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { OverviewStats } from "@/components/dashboard/overview-stats"
import { UsageAnalytics } from "@/components/dashboard/usage-analytics"
import { WorkflowList } from "@/components/dashboard/workflow-list"

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout activeTab="dashboard">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your AI API workflows.</p>
          </div>

          <OverviewStats />
          <UsageAnalytics />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WorkflowList />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
