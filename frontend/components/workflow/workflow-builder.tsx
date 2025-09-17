"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Play, Brain, MessageSquare, Key, Webhook, Database, Filter } from "lucide-react"
import { ModuleSidebar } from "./module-sidebar"
import { WorkflowCanvas } from "./workflow-canvas"
import { ModuleConfigPanel } from "./module-config-panel"

export interface AIModule {
  id: string
  type: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  config: Record<string, any>
  position?: { x: number; y: number }
}

export interface Connection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  modules: AIModule[]
  connections: Connection[]
  createdAt: Date
  updatedAt: Date
}

const defaultModules: Omit<AIModule, "id" | "position">[] = [
  {
    type: "sentiment-analysis",
    name: "Sentiment Analysis",
    description: "Analyze text sentiment (positive, negative, neutral)",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "Text Analysis",
    config: { model: "default", threshold: 0.5 },
  },
  {
    type: "keyword-extraction",
    name: "Keyword Extraction",
    description: "Extract important keywords from text",
    icon: <Key className="h-4 w-4" />,
    category: "Text Analysis",
    config: { maxKeywords: 10, minScore: 0.3 },
  },
  {
    type: "custom-model",
    name: "Custom Model",
    description: "Use your own trained AI model",
    icon: <Brain className="h-4 w-4" />,
    category: "AI Models",
    config: { modelUrl: "", apiKey: "" },
  },
  {
    type: "webhook",
    name: "Webhook",
    description: "Send data to external services",
    icon: <Webhook className="h-4 w-4" />,
    category: "Integration",
    config: { url: "", method: "POST", headers: {} },
  },
  {
    type: "data-filter",
    name: "Data Filter",
    description: "Filter and transform data",
    icon: <Filter className="h-4 w-4" />,
    category: "Data Processing",
    config: { conditions: [], transformations: [] },
  },
  {
    type: "database-store",
    name: "Database Store",
    description: "Store results in database",
    icon: <Database className="h-4 w-4" />,
    category: "Storage",
    config: { table: "", fields: {} },
  },
]

export function WorkflowBuilder() {
  const [workflow, setWorkflow] = useState<Workflow>({
    id: "new-workflow",
    name: "Untitled Workflow",
    description: "",
    modules: [],
    connections: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const [selectedModule, setSelectedModule] = useState<AIModule | null>(null)
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleAddModule = useCallback((moduleType: string, position: { x: number; y: number }) => {
    const moduleTemplate = defaultModules.find((m) => m.type === moduleType)
    if (!moduleTemplate) return

    const newModule: AIModule = {
      ...moduleTemplate,
      id: `${moduleType}-${Date.now()}`,
      position,
    }

    setWorkflow((prev) => ({
      ...prev,
      modules: [...prev.modules, newModule],
      updatedAt: new Date(),
    }))
  }, [])

  const handleModuleSelect = useCallback((module: AIModule) => {
    setSelectedModule(module)
    setIsConfigPanelOpen(true)
  }, [])

  const handleModuleUpdate = useCallback(
    (moduleId: string, updates: Partial<AIModule>) => {
      setWorkflow((prev) => ({
        ...prev,
        modules: prev.modules.map((m) => (m.id === moduleId ? { ...m, ...updates } : m)),
        updatedAt: new Date(),
      }))

      if (selectedModule?.id === moduleId) {
        setSelectedModule((prev) => (prev ? { ...prev, ...updates } : null))
      }
    },
    [selectedModule],
  )

  const handleModuleDelete = useCallback(
    (moduleId: string) => {
      setWorkflow((prev) => ({
        ...prev,
        modules: prev.modules.filter((m) => m.id !== moduleId),
        connections: prev.connections.filter((c) => c.source !== moduleId && c.target !== moduleId),
        updatedAt: new Date(),
      }))

      if (selectedModule?.id === moduleId) {
        setSelectedModule(null)
        setIsConfigPanelOpen(false)
      }
    },
    [selectedModule],
  )

  const handleConnectionCreate = useCallback((connection: Omit<Connection, "id">) => {
    const newConnection: Connection = {
      ...connection,
      id: `${connection.source}-${connection.target}-${Date.now()}`,
    }

    setWorkflow((prev) => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      updatedAt: new Date(),
    }))
  }, [])

  const handleSaveWorkflow = async () => {
    setIsSaving(true)
    try {
      const payload = {
        name: workflow.name,
        description: workflow.description,
        modules: workflow.modules,
        connections: workflow.connections,
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save workflow")
      // Optionally handle response
      console.log("Workflow saved:", await res.json())
    } catch (error) {
      console.error("Failed to save workflow:", error)
      alert("Error saving workflow")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeployWorkflow = async () => {
    // TODO: Deploy workflow to create API endpoint
    console.log("Deploying workflow:", workflow)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <Input
                value={workflow.name}
                onChange={(e) =>
                  setWorkflow((prev) => ({
                    ...prev,
                    name: e.target.value,
                    updatedAt: new Date(),
                  }))
                }
                className="text-lg font-semibold bg-transparent border-none p-0 h-auto focus-visible:ring-0"
              />
              <p className="text-sm text-muted-foreground">
                {workflow.modules.length} modules, {workflow.connections.length} connections
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleSaveWorkflow} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handleDeployWorkflow}>
              <Play className="h-4 w-4 mr-2" />
              Deploy
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Module Sidebar */}
        <ModuleSidebar modules={defaultModules} onModuleAdd={handleAddModule} />

        {/* Canvas Area */}
        <div className="flex-1 relative" ref={canvasRef}>
          <WorkflowCanvas
            modules={workflow.modules}
            connections={workflow.connections}
            onModuleSelect={handleModuleSelect}
            onModuleUpdate={handleModuleUpdate}
            onModuleDelete={handleModuleDelete}
            onConnectionCreate={handleConnectionCreate}
            onModuleAdd={handleAddModule}
          />
        </div>

        {/* Configuration Panel */}
        {isConfigPanelOpen && selectedModule && (
          <ModuleConfigPanel
            module={selectedModule}
            onUpdate={(updates) => handleModuleUpdate(selectedModule.id, updates)}
            onClose={() => setIsConfigPanelOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
