// Privacy & Compliance API functions for frontend
import { AuditLogEntry, ConsentUpdateRequest } from "./types"

export async function exportUserData(): Promise<any> {
  const res = await fetch("/privacy/export", { method: "POST", credentials: "include" })
  if (!res.ok) throw new Error("Failed to export user data")
  return res.json()
}

export async function deleteUserData(): Promise<{ detail: string }> {
  const res = await fetch("/privacy/delete", { method: "POST", credentials: "include" })
  if (!res.ok) throw new Error("Failed to delete user data")
  return res.json()
}

export async function updateConsent(data: ConsentUpdateRequest): Promise<{ detail: string }> {
  const res = await fetch("/privacy/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update consent")
  return res.json()
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const res = await fetch("/privacy/audit-logs", { credentials: "include" })
  if (!res.ok) throw new Error("Failed to fetch audit logs")
  return res.json()
}

export async function downloadAuditLogsCSV(): Promise<Blob> {
  const res = await fetch("/privacy/audit-logs/csv", { credentials: "include" })
  if (!res.ok) throw new Error("Failed to download audit logs CSV")
  return res.blob()
}
