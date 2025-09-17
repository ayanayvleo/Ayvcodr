import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { APIKeyManagement } from "@/components/settings/api-key-management"
import { UserSettings } from "@/components/settings/user-settings"
import { ComplianceSettings } from "@/components/settings/compliance-settings"

export default function SettingsPage() {
  return (
    <AuthGuard>
      <DashboardLayout activeTab="settings">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account, API keys, and privacy preferences.</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="compliance">Privacy</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <UserSettings />
            </TabsContent>

            <TabsContent value="api-keys">
              <APIKeyManagement />
            </TabsContent>

            <TabsContent value="compliance">
              <ComplianceSettings />
            </TabsContent>

            <TabsContent value="billing">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Billing settings coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
