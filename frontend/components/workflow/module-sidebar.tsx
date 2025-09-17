"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { AIModule } from "./workflow-builder"

interface ModuleSidebarProps {
  modules: Omit<AIModule, "id" | "position">[]
  onModuleAdd: (moduleType: string, position: { x: number; y: number }) => void
}

export function ModuleSidebar({ modules, onModuleAdd }: ModuleSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredModules = modules.filter(
    (module) =>
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const categories = Array.from(new Set(modules.map((m) => m.category)))

  const handleDragStart = (e: React.DragEvent, moduleType: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ moduleType }))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className="w-80 border-r border-border bg-sidebar p-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">AI Modules</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {categories.map((category) => {
          const categoryModules = filteredModules.filter((m) => m.category === category)
          if (categoryModules.length === 0) return null

          return (
            <div key={category}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wide">{category}</h3>
              <div className="space-y-2">
                {categoryModules.map((module) => (
                  <Card
                    key={module.type}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, module.type)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-primary/10 rounded-md text-primary">{module.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{module.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{module.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}

        {filteredModules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No modules found</p>
            <p className="text-xs mt-1">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
}
