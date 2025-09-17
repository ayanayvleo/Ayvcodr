"use client"

import React from "react"

import { useState, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreVertical, Settings, Trash2, Copy, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { AIModule, Connection } from "./workflow-builder"

interface WorkflowCanvasProps {
  modules: AIModule[]
  connections: Connection[]
  onModuleSelect: (module: AIModule) => void
  onModuleUpdate: (moduleId: string, updates: Partial<AIModule>) => void
  onModuleDelete: (moduleId: string) => void
  onConnectionCreate: (connection: Omit<Connection, "id">) => void
  onModuleAdd: (moduleType: string, position: { x: number; y: number }) => void
}

export function WorkflowCanvas({
  modules,
  connections,
  onModuleSelect,
  onModuleUpdate,
  onModuleDelete,
  onConnectionCreate,
  onModuleAdd,
}: WorkflowCanvasProps) {
  const [draggedModule, setDraggedModule] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<{ moduleId: string; handle: string } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()

      try {
        const data = JSON.parse(e.dataTransfer.getData("application/json"))
        const rect = canvasRef.current?.getBoundingClientRect()

        if (rect && data.moduleType) {
          const position = {
            x: e.clientX - rect.left - 100, // Center the module
            y: e.clientY - rect.top - 50,
          }
          onModuleAdd(data.moduleType, position)
        }
      } catch (error) {
        console.error("Failed to parse drop data:", error)
      }
    },
    [onModuleAdd],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleModuleDragStart = useCallback((e: React.DragEvent, moduleId: string) => {
    setDraggedModule(moduleId)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleModuleDragEnd = useCallback(() => {
    setDraggedModule(null)
  }, [])

  const handleModuleMove = useCallback(
    (moduleId: string, position: { x: number; y: number }) => {
      onModuleUpdate(moduleId, { position })
    },
    [onModuleUpdate],
  )

  const handleConnectionStart = useCallback((moduleId: string, handle: string) => {
    setConnecting({ moduleId, handle })
  }, [])

  const handleConnectionEnd = useCallback(
    (targetModuleId: string, targetHandle: string) => {
      if (connecting && connecting.moduleId !== targetModuleId) {
        onConnectionCreate({
          source: connecting.moduleId,
          target: targetModuleId,
          sourceHandle: connecting.handle,
          targetHandle: targetHandle,
        })
      }
      setConnecting(null)
    },
    [connecting, onConnectionCreate],
  )

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-muted/20 overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => setConnecting(null)}
    >
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Connections */}
      <svg className="absolute inset-0 pointer-events-none">
        {connections.map((connection) => {
          const sourceModule = modules.find((m) => m.id === connection.source)
          const targetModule = modules.find((m) => m.id === connection.target)

          if (!sourceModule?.position || !targetModule?.position) return null

          const startX = sourceModule.position.x + 200 // Module width
          const startY = sourceModule.position.y + 50 // Module height / 2
          const endX = targetModule.position.x
          const endY = targetModule.position.y + 50

          const midX = (startX + endX) / 2

          return (
            <path
              key={connection.id}
              d={`M ${startX} ${startY} C ${midX} ${startY} ${midX} ${endY} ${endX} ${endY}`}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          )
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" />
          </marker>
        </defs>
      </svg>

      {/* Modules */}
      {modules.map((module) => (
        <ModuleNode
          key={module.id}
          module={module}
          isConnecting={connecting?.moduleId === module.id}
          onSelect={() => onModuleSelect(module)}
          onDelete={() => onModuleDelete(module.id)}
          onMove={handleModuleMove}
          onConnectionStart={handleConnectionStart}
          onConnectionEnd={handleConnectionEnd}
          onDragStart={handleModuleDragStart}
          onDragEnd={handleModuleDragEnd}
        />
      ))}

      {/* Empty State */}
      {modules.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="p-4 bg-muted rounded-lg mb-4 inline-block">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Start Building Your Workflow</h3>
            <p className="text-muted-foreground">Drag AI modules from the sidebar to get started</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface ModuleNodeProps {
  module: AIModule
  isConnecting: boolean
  onSelect: () => void
  onDelete: () => void
  onMove: (moduleId: string, position: { x: number; y: number }) => void
  onConnectionStart: (moduleId: string, handle: string) => void
  onConnectionEnd: (moduleId: string, handle: string) => void
  onDragStart: (e: React.DragEvent, moduleId: string) => void
  onDragEnd: () => void
}

function ModuleNode({
  module,
  isConnecting,
  onSelect,
  onDelete,
  onMove,
  onConnectionStart,
  onConnectionEnd,
  onDragStart,
  onDragEnd,
}: ModuleNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest(".module-menu")) {
        return // Don't start drag if clicking on menu
      }

      setIsDragging(true)
      setDragStart({
        x: e.clientX - (module.position?.x || 0),
        y: e.clientY - (module.position?.y || 0),
      })
    },
    [module.position],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPosition = {
          x: Math.max(0, e.clientX - dragStart.x),
          y: Math.max(0, e.clientY - dragStart.y),
        }
        onMove(module.id, newPosition)
      }
    },
    [isDragging, dragStart, module.id, onMove],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!module.position) return null

  return (
    <div
      className={`absolute select-none ${isDragging ? "z-50" : "z-10"}`}
      style={{
        left: module.position.x,
        top: module.position.y,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <Card className={`w-48 shadow-lg ${isConnecting ? "ring-2 ring-primary" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-primary/10 rounded text-primary">{module.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{module.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {module.category}
                </Badge>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="module-menu h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSelect}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="text-xs text-muted-foreground mb-3">{module.description}</p>

          {/* Connection Handles */}
          <div className="flex justify-between">
            <button
              className="w-3 h-3 bg-muted border-2 border-primary rounded-full hover:bg-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onConnectionEnd(module.id, "input")
              }}
              title="Input"
            />
            <button
              className="w-3 h-3 bg-muted border-2 border-primary rounded-full hover:bg-primary transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onConnectionStart(module.id, "output")
              }}
              title="Output"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
