"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Copy, Eye, EyeOff, Trash2, Calendar, Shield, Activity, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  fetchAPIKeys,
  createAPIKey,
  deleteAPIKey,
  updateAPIKey,
  APIKey as APIKeyType,
  APIKeyCreate,
} from "@/lib/api-keys"

interface WorkflowMeta {
  id: string
  name: string
}

interface NewKeyData {
  name: string
  permissions: string[]
  rateLimit: number
  expiresAt: string
  description: string
  workflowPermissions: { [workflowId: string]: string[] }
}

export function APIKeyManagement() {
  // TODO: Replace with real user ID from auth context/session
  const userId = 1
  const [apiKeys, setAPIKeys] = useState<APIKeyType[]>([])
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newKeyData, setNewKeyData] = useState<NewKeyData>({
    name: "",
    permissions: [],
    rateLimit: 1000,
    expiresAt: "",
    description: "",
    workflowPermissions: {},
  })

  const [workflows] = useState<WorkflowMeta[]>([
    { id: "1", name: "Customer Sentiment Analysis" },
    { id: "2", name: "Content Keyword Extraction" },
    { id: "3", name: "Product Review Classifier" },
    { id: "4", name: "Email Auto-Responder" },
  ])

  useEffect(() => {
    fetchAPIKeys(userId).then(setAPIKeys)
  }, [userId])

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys((prev: Record<string, boolean>) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleCreateKey = async () => {
    const payload: APIKeyCreate = {
      name: newKeyData.name,
      permissions: newKeyData.permissions,
      rate_limit: newKeyData.rateLimit,
      expires_at: newKeyData.expiresAt || undefined,
      workflow_permissions: newKeyData.workflowPermissions,
    }
    const created = await createAPIKey(userId, payload)
  setAPIKeys((prev: APIKeyType[]) => [...prev, created])
    setIsCreateDialogOpen(false)
    setNewKeyData({
      name: "",
      permissions: [],
      rateLimit: 1000,
      expiresAt: "",
      description: "",
      workflowPermissions: {},
    })
  }

  const handleDeleteKey = async (keyId: number) => {
    await deleteAPIKey(userId, keyId)
  setAPIKeys((prev: APIKeyType[]) => prev.filter((key: APIKeyType) => key.id !== keyId))
  }

  const toggleKeyStatus = (keyId: number) => {
    setAPIKeys((prev: APIKeyType[]) =>
      prev.map((key: APIKeyType) => (key.id === keyId ? { ...key, is_active: !key.is_active } : key))
    )
    // Optionally, call updateAPIKey here to persist status change
  }

  const getPermissionColor = (permission: string): string => {
    switch (permission) {
      case "read":
        return "bg-blue-100 text-blue-800"
      case "write":
        return "bg-green-100 text-green-800"
      case "deploy":
        return "bg-purple-100 text-purple-800"
      case "admin":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const maskKey = (key: string): string => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-muted-foreground">Manage API keys for accessing your workflows</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>Generate a new API key with specific permissions and rate limits.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production API Key"
                  value={newKeyData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewKeyData((prev: NewKeyData) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2">
                  {["read", "write", "deploy", "admin"].map((permission) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newKeyData.permissions.includes(permission)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (e.target.checked) {
                            setNewKeyData((prev: NewKeyData) => ({
                              ...prev,
                              permissions: [...prev.permissions, permission],
                            }))
                          } else {
                            setNewKeyData((prev: NewKeyData) => ({
                              ...prev,
                              permissions: prev.permissions.filter((p: string) => p !== permission),
                            }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate-limit">Rate Limit (requests/hour)</Label>
                <Select
                  value={newKeyData.rateLimit.toString()}
                  onValueChange={(value: string) =>
                    setNewKeyData((prev: NewKeyData) => ({ ...prev, rateLimit: Number.parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 requests/hour</SelectItem>
                    <SelectItem value="1000">1,000 requests/hour</SelectItem>
                    <SelectItem value="10000">10,000 requests/hour</SelectItem>
                    <SelectItem value="100000">100,000 requests/hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires-at">Expiration Date (Optional)</Label>
                <Input
                  id="expires-at"
                  type="date"
                  value={newKeyData.expiresAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewKeyData((prev: NewKeyData) => ({ ...prev, expiresAt: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Granular Workflow Permissions</Label>
                {workflows.map((wf: WorkflowMeta) => (
                  <div key={wf.id} className="mb-2">
                    <div className="font-medium text-sm mb-1">{wf.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {["read", "write", "deploy", "admin"].map((permission) => (
                        <label key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={
                              newKeyData.workflowPermissions?.[wf.id]?.includes(permission) || false
                            }
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setNewKeyData((prev: NewKeyData) => {
                                const prevPerms: string[] = prev.workflowPermissions?.[wf.id] || []
                                let updated: string[]
                                if (e.target.checked) {
                                  updated = [...prevPerms, permission]
                                } else {
                                  updated = prevPerms.filter((p: string) => p !== permission)
                                }
                                return {
                                  ...prev,
                                  workflowPermissions: {
                                    ...prev.workflowPermissions,
                                    [wf.id]: updated,
                                  },
                                }
                              })
                            }}
                            className="rounded"
                          />
                          <span className="text-xs capitalize">{permission}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={!newKeyData.name || newKeyData.permissions.length === 0}>
                Create Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
  {apiKeys.map((apiKey: APIKeyType) => (
          <Card key={apiKey.id} className={!apiKey.is_active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{apiKey.name}</span>
                    {!apiKey.is_active && <Badge variant="secondary">Inactive</Badge>}
                    {apiKey.expires_at && new Date(apiKey.expires_at) < new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map((permission: string) => (
                      <Badge key={permission} className={getPermissionColor(permission)}>
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={apiKey.is_active} onCheckedChange={() => toggleKeyStatus(apiKey.id)} />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{apiKey.name}"? This action cannot be undone and will
                          immediately revoke access for any applications using this key.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteKey(apiKey.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                  {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                </code>
                <Button variant="outline" size="sm" onClick={() => toggleKeyVisibility(apiKey.id.toString())}>
                  {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{apiKey.usage_count?.toLocaleString?.() ?? 0}</p>
                    <p className="text-muted-foreground">Requests</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{apiKey.rate_limit?.toLocaleString?.() ?? 0}/hr</p>
                    <p className="text-muted-foreground">Rate Limit</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString() : "Never"}
                    </p>
                    <p className="text-muted-foreground">Last Used</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {apiKey.expires_at ? new Date(apiKey.expires_at).toLocaleDateString() : "Never"}
                    </p>
                    <p className="text-muted-foreground">Expires</p>
                  </div>
                </div>
              </div>

              {apiKey.expires_at &&
                new Date(apiKey.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                  <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      This API key will expire soon. Consider renewing it to avoid service interruption.
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">No API keys found</p>
            <p className="text-sm mt-1">Create your first API key to start using the API</p>
          </div>
        </div>
      )}
    </div>
  )
}