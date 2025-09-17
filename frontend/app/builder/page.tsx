import { AuthGuard } from "@/components/auth/auth-guard"
import { WorkflowBuilder } from "@/components/workflow/workflow-builder"

export default function BuilderPage() {
  return (
    <AuthGuard>
      <WorkflowBuilder />
    </AuthGuard>
  )
}
