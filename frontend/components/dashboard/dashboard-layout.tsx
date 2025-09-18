"use client"
function CreateAPIButton() {
  const [open, setOpen] = useState(false)
  const [apiName, setApiName] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateAPI = async () => {
    setIsLoading(true)
    try {
      const payload = { name: apiName, endpoint }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api-endpoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create API endpoint")
      setOpen(false)
      setApiName("")
      setEndpoint("")
    } catch (err) {
      alert("Error creating API endpoint")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/30 border border-green-400/20 transition-all duration-300 hover:shadow-xl hover:shadow-green-900/40">
          <Plus className="h-4 w-4 mr-2" />
          Create API
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New API Endpoint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="API Name"
            value={apiName}
            onChange={e => setApiName(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Endpoint URL"
            value={endpoint}
            onChange={e => setEndpoint(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <Button onClick={handleCreateAPI} disabled={isLoading || !apiName || !endpoint}>
            {isLoading ? "Creating..." : "Create API"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
// All imports at the top
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bot,
  Plus,
  Search,
  Bell,
  Settings,
  LogOut,
  LayoutDashboard,
  Workflow,
  BarChart3,
  Key,
  User,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"


interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab?: string
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function DashboardLayout({ children, activeTab = "dashboard" }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState({
    name: "",
    email: "",
    initials: "",
  })

  // Load user info from backend
  React.useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setUser({
          name: data.username,
          email: data.email,
          initials: (data.username || "").split(" ").map((w: string) => w[0]).join("").toUpperCase(),
        })
      })
      .catch(() => {
        localStorage.removeItem("token")
        router.push("/login")
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/login")
  }

  const handleProfile = () => {
    router.push("/profile")
  }

  const handleSettings = () => {
    router.push("/settings")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-green-100">
      {/* Header */}
      <header className="border-b border-green-900/30 bg-slate-900/80 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-2 group">
              <Bot className="h-8 w-8 text-green-400 group-hover:text-green-300 transition-colors duration-300" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                AI API Builder
              </span>
            </Link>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400/60" />
              <Input
                placeholder="Search workflows..."
                className="pl-10 w-64 bg-slate-800/50 border-green-900/30 text-green-100 placeholder:text-green-400/40 focus:border-green-400/50 focus:ring-green-400/20"
              />
            </div>

            <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300 hover:bg-green-900/20">
              <Bell className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-green-900/20">
                  <Avatar className="h-8 w-8 border border-green-400/30">
                    <AvatarFallback className="bg-green-900/50 text-green-300">{user.initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-slate-900/95 border-green-900/30 backdrop-blur-xl"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-green-100">{user.name}</p>
                    <p className="text-xs leading-none text-green-400/60">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-green-900/30" />
                <DropdownMenuItem className="text-green-100 hover:bg-green-900/20 focus:bg-green-900/20" onClick={handleProfile}>
                  <User className="mr-2 h-4 w-4 text-green-400" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-green-100 hover:bg-green-900/20 focus:bg-green-900/20" onClick={handleSettings}>
                  <Settings className="mr-2 h-4 w-4 text-green-400" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-green-900/30" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-green-100 hover:bg-red-900/20 focus:bg-red-900/20"
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-400" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 border-r border-green-900/30 bg-slate-900/50 backdrop-blur-xl p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = activeTab === item.name.toLowerCase()
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-green-900/40 text-green-300 shadow-lg shadow-green-900/20 border border-green-400/20"
                      : "text-green-100/80 hover:bg-green-900/20 hover:text-green-300 hover:shadow-md hover:shadow-green-900/10"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-green-400" : "text-green-400/60"}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          <div className="mt-8 space-y-2">
            <Link href="/builder">
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/30 border border-green-400/20 transition-all duration-300 hover:shadow-xl hover:shadow-green-900/40">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </Link>
            <CreateAPIButton />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">{children}</main>
      </div>
    </div>
  )
}
