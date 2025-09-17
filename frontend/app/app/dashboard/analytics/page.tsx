import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { UsageAnalytics } from "@/components/dashboard/usage-analytics"
import { APIEndpoints } from "@/components/dashboard/api-endpoints"

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <DashboardLayout activeTab="analytics">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Detailed insights into your API usage and performance.</p>
          </div>

          <UsageAnalytics />
          <APIEndpoints />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
