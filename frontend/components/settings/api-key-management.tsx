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

interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  rateLimit: number
  usageCount: number
  lastUsed: Date
  createdAt: Date
  expiresAt?: Date
  isActive: boolean
}

const mockAPIKeys: APIKey[] = [
  {
    id: "1",
    name: "Production API Key",
    key: "sk-prod-1234567890abcdef",
    permissions: ["read", "write", "deploy"],
    rateLimit: 10000,
    usageCount: 4200,
    lastUsed: new Date("2024-01-07T10:30:00"),
    createdAt: new Date("2024-01-01"),
    isActive: true,
  },
  {
    id: "2",
    name: "Development Key",
    key: "sk-dev-abcdef1234567890",
    permissions: ["read", "write"],
    rateLimit: 1000,
    usageCount: 850,
    lastUsed: new Date("2024-01-06T15:45:00"),
    createdAt: new Date("2024-01-03"),
    expiresAt: new Date("2024-06-01"),
    isActive: true,
  },
  {
    id: "3",
    name: "Testing Key",
    key: "sk-test-fedcba0987654321",
    permissions: ["read"],
    rateLimit: 100,
    usageCount: 45,
    lastUsed: new Date("2024-01-05T09:15:00"),
    createdAt: new Date("2024-01-05"),
    isActive: false,
  },
]

export function APIKeyManagement() {
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([])
  // Fetch API keys from backend on mount
  useEffect(() => {
    let isMounted = true;
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-keys`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          // Parse date fields if they are strings
          setAPIKeys(
            data.map((k: any) => ({
              ...k,
              lastUsed: k.lastUsed ? new Date(k.lastUsed) : undefined,
              createdAt: k.createdAt ? new Date(k.createdAt) : undefined,
              expiresAt: k.expiresAt ? new Date(k.expiresAt) : undefined,
            }))
          );
        }
      })
      .catch(() => {
        // fallback to mock data if fetch fails
        if (isMounted) setAPIKeys(mockAPIKeys);
      });
    return () => { isMounted = false; };
  }, []);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    name: "",
    permissions: [] as string[],
    rateLimit: 1000,
    expiresAt: "",
    description: "",
  })

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleCreateKey = () => {
    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyData.name,
      key: `sk-${Date.now().toString(36)}`,
      permissions: newKeyData.permissions,
      rateLimit: newKeyData.rateLimit,
      usageCount: 0,
      lastUsed: new Date(),
      createdAt: new Date(),
      expiresAt: newKeyData.expiresAt ? new Date(newKeyData.expiresAt) : undefined,
      isActive: true,
    }

    setAPIKeys((prev) => [...prev, newKey])
    setIsCreateDialogOpen(false)
    setNewKeyData({
      name: "",
      permissions: [],
      rateLimit: 1000,
      expiresAt: "",
      description: "",
    })
  }

  const handleDeleteKey = (keyId: string) => {
    setAPIKeys((prev) => prev.filter((key) => key.id !== keyId))
  }

  const toggleKeyStatus = (keyId: string) => {
    setAPIKeys((prev) => prev.map((key) => (key.id === keyId ? { ...key, isActive: !key.isActive } : key)))
  }

  const getPermissionColor = (permission: string) => {
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

  const maskKey = (key: string) => {
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
                  onChange={(e) => setNewKeyData((prev) => ({ ...prev, name: e.target.value }))}
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
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewKeyData((prev) => ({
                              ...prev,
                              permissions: [...prev.permissions, permission],
                            }))
                          } else {
                            setNewKeyData((prev) => ({
                              ...prev,
                              permissions: prev.permissions.filter((p) => p !== permission),
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
                  onValueChange={(value) => setNewKeyData((prev) => ({ ...prev, rateLimit: Number.parseInt(value) }))}
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
                  onChange={(e) => setNewKeyData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                />
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
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id} className={!apiKey.isActive ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <span>{apiKey.name}</span>
                    {!apiKey.isActive && <Badge variant="secondary">Inactive</Badge>}
                    {apiKey.expiresAt && apiKey.expiresAt < new Date() && <Badge variant="destructive">Expired</Badge>}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map((permission) => (
                      <Badge key={permission} className={getPermissionColor(permission)}>
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch checked={apiKey.isActive} onCheckedChange={() => toggleKeyStatus(apiKey.id)} />
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
                <Button variant="outline" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
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
                    <p className="font-medium">{apiKey.usageCount.toLocaleString()}</p>
                    <p className="text-muted-foreground">Requests</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{apiKey.rateLimit.toLocaleString()}/hr</p>
                    <p className="text-muted-foreground">Rate Limit</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{apiKey.lastUsed.toLocaleDateString()}</p>
                    <p className="text-muted-foreground">Last Used</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{apiKey.expiresAt ? apiKey.expiresAt.toLocaleDateString() : "Never"}</p>
                    <p className="text-muted-foreground">Expires</p>
                  </div>
                </div>
              </div>

              {apiKey.expiresAt && apiKey.expiresAt < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
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
