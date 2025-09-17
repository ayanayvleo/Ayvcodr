"use client"

import { useState, useEffect } from "react"
import {
  exportUserData,
  deleteUserData,
  updateConsent,
  getAuditLogs,
  downloadAuditLogsCSV,
} from "@/lib/privacy"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, Download, Trash2, FileText, Lock, Eye, AlertTriangle, CheckCircle, Calendar } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ComplianceSettings() {
  // Policy links (replace URLs with your actual policy docs)
  const policyLinks = [
    { label: "Privacy Policy", url: "/privacy-policy.pdf" },
    { label: "Terms of Service", url: "/terms-of-service.pdf" },
    { label: "Data Processing Addendum", url: "/dpa.pdf" },
  ]

  // Compliance badges (add or adjust as needed)
  const complianceBadges = [
    { label: "GDPR", color: "bg-blue-100 text-blue-800" },
    { label: "CCPA", color: "bg-yellow-100 text-yellow-800" },
    { label: "SOC 2", color: "bg-green-100 text-green-800" },
  ]
  const [gdprSettings, setGdprSettings] = useState({
    dataProcessingConsent: true,
    marketingConsent: false,
    analyticsConsent: true,
    cookieConsent: true,
  })
  const [loadingExport, setLoadingExport] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)
  const [exportedData, setExportedData] = useState<any | null>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const [ccpaSettings, setCcpaSettings] = useState({
    doNotSell: false,
    optOutAnalytics: false,
    deletePersonalInfo: false,
  })

  const [privacySettings, setPrivacySettings] = useState({
    dataRetention: "2-years",
    anonymizeData: true,
    encryptData: true,
    auditLogging: true,
  })


  useEffect(() => {
    getAuditLogs()
      .then(setAuditLogs)
      .catch(() => setAuditLogs([]))
  }, [])

  const handleExportData = async () => {
    setLoadingExport(true)
    setError(null)
    try {
      const data = await exportUserData()
      setExportedData(data)
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "user-data.json"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingExport(false)
    }
  }

  const handleAnonymizeData = async () => {
    // TODO: Implement data anonymization
    console.log("Anonymizing user data...")
  }

  const handleDeleteAccount = async () => {
    setLoadingDelete(true)
    setError(null)
    try {
      await deleteUserData()
      // Optionally, redirect or show a message
      window.location.reload()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingDelete(false)
    }
  }

  const downloadAuditLogs = async () => {
    try {
      const blob = await downloadAuditLogsCSV()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "audit-logs.csv"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Compliance Policy & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Compliance & Policies</span>
          </CardTitle>
          <CardDescription>Review our compliance status and access policy documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {complianceBadges.map((badge) => (
              <span key={badge.label} className={`px-2 py-1 rounded text-xs font-semibold ${badge.color}`}>
                {badge.label}
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {policyLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline hover:text-blue-900 text-sm"
              >
                {link.label}
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
      <div>
        <h2 className="text-2xl font-bold">Privacy & Compliance</h2>
        <p className="text-muted-foreground">Manage your privacy settings and compliance preferences</p>
      </div>

      {/* GDPR Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>GDPR Compliance</span>
            <Badge variant="outline">EU</Badge>
          </CardTitle>
          <CardDescription>General Data Protection Regulation settings for EU users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data Processing Consent</Label>
              <p className="text-sm text-muted-foreground">
                Allow processing of personal data for service functionality
              </p>
            </div>
            <Switch
              checked={gdprSettings.dataProcessingConsent}
              onCheckedChange={async (checked: boolean) => {
                setGdprSettings((prev: typeof gdprSettings) => ({ ...prev, dataProcessingConsent: checked }))
                await updateConsent({ data_processing_consent: checked })
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">Consent to receive marketing emails and updates</p>
            </div>
            <Switch
              checked={gdprSettings.marketingConsent}
              onCheckedChange={async (checked: boolean) => {
                setGdprSettings((prev: typeof gdprSettings) => ({ ...prev, marketingConsent: checked }))
                await updateConsent({ marketing_consent: checked })
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Analytics & Performance</Label>
              <p className="text-sm text-muted-foreground">
                Allow collection of usage analytics for service improvement
              </p>
            </div>
            <Switch
              checked={gdprSettings.analyticsConsent}
              onCheckedChange={async (checked: boolean) => {
                setGdprSettings((prev: typeof gdprSettings) => ({ ...prev, analyticsConsent: checked }))
                await updateConsent({ analytics_consent: checked })
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cookie Consent</Label>
              <p className="text-sm text-muted-foreground">Allow non-essential cookies for enhanced functionality</p>
            </div>
            <Switch
              checked={gdprSettings.cookieConsent}
              onCheckedChange={async (checked: boolean) => {
                setGdprSettings((prev: typeof gdprSettings) => ({ ...prev, cookieConsent: checked }))
                await updateConsent({ cookie_consent: checked })
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* CCPA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>CCPA Compliance</span>
            <Badge variant="outline">California</Badge>
          </CardTitle>
          <CardDescription>California Consumer Privacy Act settings for California residents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Do Not Sell My Personal Information</Label>
              <p className="text-sm text-muted-foreground">
                Opt out of the sale of personal information to third parties
              </p>
            </div>
            <Switch
              checked={ccpaSettings.doNotSell}
              onCheckedChange={(checked: boolean) => setCcpaSettings((prev: typeof ccpaSettings) => ({ ...prev, doNotSell: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Opt Out of Analytics</Label>
              <p className="text-sm text-muted-foreground">Exclude personal data from analytics and tracking</p>
            </div>
            <Switch
              checked={ccpaSettings.optOutAnalytics}
              onCheckedChange={(checked: boolean) => setCcpaSettings((prev: typeof ccpaSettings) => ({ ...prev, optOutAnalytics: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>Export, anonymize, or delete your personal data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={handleExportData} className="flex items-center space-x-2 bg-transparent">
              <Download className="h-4 w-4" />
              <span>Export My Data</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleAnonymizeData}
              className="flex items-center space-x-2 bg-transparent"
            >
              <Eye className="h-4 w-4" />
              <span>Anonymize Data</span>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span>Delete Account</span>
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account, all workflows, API keys,
                    and associated data. Are you absolutely sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Data Retention Policy</p>
                <p className="text-sm text-muted-foreground">
                  Personal data is automatically anonymized after 2 years of inactivity. Workflow data is retained for
                  analytics but can be anonymized on request.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Audit Logs</span>
              </CardTitle>
              <CardDescription>Track privacy-related actions and data processing activities</CardDescription>
            </div>
            <Button variant="outline" onClick={downloadAuditLogs}>
              <Download className="h-4 w-4 mr-2" />
              Download Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-1 rounded-full ${
                      log.status === "completed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {log.status === "completed" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{log.action}</p>
                    <p className="text-xs text-muted-foreground">{log.details}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
