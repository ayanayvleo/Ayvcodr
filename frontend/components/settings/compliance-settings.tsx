"use client"

import { useState } from "react"
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
  const [gdprSettings, setGdprSettings] = useState({
    dataProcessingConsent: true,
    marketingConsent: false,
    analyticsConsent: true,
    cookieConsent: true,
  })

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

  const [auditLogs] = useState([
    {
      id: "1",
      action: "Data Export Request",
      timestamp: new Date("2024-01-07T10:30:00"),
      status: "completed",
      details: "User requested data export under GDPR Article 15",
    },
    {
      id: "2",
      action: "Data Anonymization",
      timestamp: new Date("2024-01-06T15:45:00"),
      status: "completed",
      details: "Automated anonymization of workflow data older than 2 years",
    },
    {
      id: "3",
      action: "Consent Update",
      timestamp: new Date("2024-01-05T09:15:00"),
      status: "completed",
      details: "User updated marketing consent preferences",
    },
  ])

  const handleExportData = async () => {
    // TODO: Implement data export
    console.log("Exporting user data...")
  }

  const handleAnonymizeData = async () => {
    // TODO: Implement data anonymization
    console.log("Anonymizing user data...")
  }

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion
    console.log("Deleting user account...")
  }

  const downloadAuditLogs = () => {
    const csvContent = [
      "ID,Action,Timestamp,Status,Details",
      ...auditLogs.map(
        (log) => `${log.id},"${log.action}","${log.timestamp.toISOString()}","${log.status}","${log.details}"`,
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "audit-logs.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
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
              onCheckedChange={(checked) => setGdprSettings((prev) => ({ ...prev, dataProcessingConsent: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">Consent to receive marketing emails and updates</p>
            </div>
            <Switch
              checked={gdprSettings.marketingConsent}
              onCheckedChange={(checked) => setGdprSettings((prev) => ({ ...prev, marketingConsent: checked }))}
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
              onCheckedChange={(checked) => setGdprSettings((prev) => ({ ...prev, analyticsConsent: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cookie Consent</Label>
              <p className="text-sm text-muted-foreground">Allow non-essential cookies for enhanced functionality</p>
            </div>
            <Switch
              checked={gdprSettings.cookieConsent}
              onCheckedChange={(checked) => setGdprSettings((prev) => ({ ...prev, cookieConsent: checked }))}
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
              onCheckedChange={(checked) => setCcpaSettings((prev) => ({ ...prev, doNotSell: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Opt Out of Analytics</Label>
              <p className="text-sm text-muted-foreground">Exclude personal data from analytics and tracking</p>
            </div>
            <Switch
              checked={ccpaSettings.optOutAnalytics}
              onCheckedChange={(checked) => setCcpaSettings((prev) => ({ ...prev, optOutAnalytics: checked }))}
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
            {auditLogs.map((log) => (
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
                  <span>{log.timestamp.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
