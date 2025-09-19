"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Save, Upload, Bell, Shield, Moon, Sun, Globe } from "lucide-react"

export function UserSettings() {
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0])
      setPhotoUrl(URL.createObjectURL(e.target.files[0]))
    } else {
      setPhoto(null)
    }
  }

  const handleUploadPhoto = async () => {
    if (!photo) return
    setUploading(true)
    const token = localStorage.getItem("token")
    const formData = new FormData()
    formData.append("file", photo) // FastAPI expects 'file' as the key
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setPhotoUrl(data.photoUrl)
        setPhoto(null)
        // Optionally clear the file input
      }
    } catch (err) {
      // handle error
    } finally {
      setUploading(false)
    }
  }
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    company: "",
    bio: "",
    timezone: "America/New_York",
    language: "en",
  })

  React.useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProfile((prev) => ({
          ...prev,
          name: data.username || "",
          email: data.email || "",
          // Add company, bio, timezone, language if available from backend
        }))
      })
      .catch(() => {})
  }, [])

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    workflowAlerts: true,
    usageAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
  })

  const [preferences, setPreferences] = useState({
    theme: "system",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    defaultWorkflowVisibility: "private",
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: profile.name,
          email: profile.email,
          // Add company, bio, timezone, language if supported by backend
        }),
      })
      if (!res.ok) throw new Error("Failed to save profile")
      const data = await res.json()
      setProfile((prev) => ({ ...prev, name: data.username, email: data.email }))
    } catch (error) {
      console.error("Failed to save profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    try {
      // TODO: Save to backend
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Notifications saved:", notifications)
    } catch (error) {
      console.error("Failed to save notifications:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    try {
      // TODO: Save to backend
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Preferences saved:", preferences)
    } catch (error) {
      console.error("Failed to save preferences:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">User Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>Update your personal information and profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <AvatarFallback className="text-lg">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
              <Button variant="outline" size="sm" onClick={handleUploadPhoto} disabled={!photo || uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profile.company}
                onChange={(e) => setProfile((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={profile.timezone}
                onValueChange={(value) => setProfile((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
              rows={3}
              placeholder="Tell us about yourself..."
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>Choose how you want to be notified about important events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, emailNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Workflow Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when workflows fail or complete</p>
              </div>
              <Switch
                checked={notifications.workflowAlerts}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, workflowAlerts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Usage Alerts</Label>
                <p className="text-sm text-muted-foreground">Alerts when approaching rate limits or quotas</p>
              </div>
              <Switch
                checked={notifications.usageAlerts}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, usageAlerts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Security Alerts</Label>
                <p className="text-sm text-muted-foreground">Important security and account notifications</p>
              </div>
              <Switch
                checked={notifications.securityAlerts}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, securityAlerts: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Product updates and promotional content</p>
              </div>
              <Switch
                checked={notifications.marketingEmails}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketingEmails: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Weekly usage and performance summaries</p>
              </div>
              <Switch
                checked={notifications.weeklyReports}
                onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, weeklyReports: checked }))}
              />
            </div>
          </div>

          <Button onClick={handleSaveNotifications} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Notifications"}
          </Button>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Application Preferences</span>
          </CardTitle>
          <CardDescription>Customize your application experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={preferences.theme}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={profile.language}
                onValueChange={(value) => setProfile((prev) => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select
                value={preferences.dateFormat}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, dateFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select
                value={preferences.timeFormat}
                onValueChange={(value) => setPreferences((prev) => ({ ...prev, timeFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSavePreferences} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
