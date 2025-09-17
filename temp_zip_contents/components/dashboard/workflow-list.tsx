"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MoreVertical, Search, Play, Pause, Edit, Copy, Trash2, ExternalLink, Calendar, Activity } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

interface Workflow {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "draft"
  apiCalls: number
  lastUsed: Date
  createdAt: Date
  endpoint?: string
}

const mockWorkflows: Workflow[] = [
  {
    id: "1",
    name: "Customer Sentiment Analysis",
    description: "Analyzes customer feedback sentiment and extracts key insights",
    status: "active",
    apiCalls: 4200,
    lastUsed: new Date("2024-01-07"),
    createdAt: new Date("2024-01-01"),
    endpoint: "https://api.example.com/workflows/sentiment-analysis",
  },
  {
    id: "2",
    name: "Content Keyword Extraction",
    description: "Extracts relevant keywords from blog posts and articles",
    status: "active",
    apiCalls: 3100,
    lastUsed: new Date("2024-01-06"),
    createdAt: new Date("2024-01-02"),
    endpoint: "https://api.example.com/workflows/keyword-extraction",
  },
  {
    id: "3",
    name: "Product Review Classifier",
    description: "Classifies product reviews by category and sentiment",
    status: "paused",
    apiCalls: 1500,
    lastUsed: new Date("2024-01-04"),
    createdAt: new Date("2024-01-03"),
    endpoint: "https://api.example.com/workflows/review-classifier",
  },
  {
    id: "4",
    name: "Email Auto-Responder",
    description: "Automatically generates contextual email responses",
    status: "draft",
    apiCalls: 0,
    lastUsed: new Date("2024-01-05"),
    createdAt: new Date("2024-01-05"),
  },
]

export function WorkflowList() {
  const [workflows] = useState<Workflow[]>(mockWorkflows)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || workflow.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflows</h2>
          <p className="text-muted-foreground">Manage and monitor your AI API workflows</p>
        </div>
        <Link href="/builder">
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2">
          {["all", "active", "paused", "draft"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Workflow Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    {workflow.endpoint && (
                      <DropdownMenuItem>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View API
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      {workflow.status === "active" ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <CardDescription className="text-sm">{workflow.description}</CardDescription>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Activity className="h-3 w-3" />
                  <span>{workflow.apiCalls.toLocaleString()} calls</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{workflow.lastUsed.toLocaleDateString()}</span>
                </div>
              </div>

              {workflow.endpoint && (
                <div className="p-2 bg-muted rounded text-xs font-mono truncate">{workflow.endpoint}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <p className="text-lg font-medium">No workflows found</p>
            <p className="text-sm mt-1">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first workflow to get started"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
