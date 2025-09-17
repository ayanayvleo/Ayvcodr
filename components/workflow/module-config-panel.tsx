"use client"

import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Save } from "lucide-react"
import type { AIModule } from "./workflow-builder"

interface ModuleConfigPanelProps {
  module: AIModule
  onUpdate: (updates: Partial<AIModule>) => void
  onClose: () => void
}

export function ModuleConfigPanel({ module, onUpdate, onClose }: ModuleConfigPanelProps) {
  const [config, setConfig] = useState(module.config)
  const [name, setName] = useState(module.name)
  const [description, setDescription] = useState(module.description)

  const handleSave = () => {
    onUpdate({
      name,
      description,
      config,
    })
  }

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const renderConfigField = (key: string, value: any) => {
    switch (typeof value) {
      case "string":
        if (key.toLowerCase().includes("url") || key.toLowerCase().includes("endpoint")) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
              <Input
                id={key}
                type="url"
                value={value}
                onChange={(e) => updateConfig(key, e.target.value)}
                placeholder="https://..."
              />
            </div>
          )
        }
        if (key.toLowerCase().includes("key") || key.toLowerCase().includes("token")) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
              <Input
                id={key}
                type="password"
                value={value}
                onChange={(e) => updateConfig(key, e.target.value)}
                placeholder="Enter API key..."
              />
            </div>
          )
        }
        if (value.length > 50) {
          return (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
              <Textarea id={key} value={value} onChange={(e) => updateConfig(key, e.target.value)} rows={3} />
            </div>
          )
        }
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
            <Input id={key} value={value} onChange={(e) => updateConfig(key, e.target.value)} />
          </div>
        )

      case "number":
        return (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) => updateConfig(key, Number.parseFloat(e.target.value) || 0)}
              step={key.toLowerCase().includes("threshold") || key.toLowerCase().includes("score") ? 0.1 : 1}
            />
          </div>
        )

      case "boolean":
        return (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
            <Switch id={key} checked={value} onCheckedChange={(checked) => updateConfig(key, checked)} />
          </div>
        )

      default:
        if (Array.isArray(value)) {
          return (
            <div key={key} className="space-y-2">
              <Label>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}</Label>
              <div className="text-sm text-muted-foreground">Array configuration (advanced)</div>
            </div>
          )
        }
        return null
    }
  }

  return (
    <div className="w-80 border-l border-border bg-card h-full overflow-y-auto">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Configure Module</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="font-medium">Basic Information</h3>

          <div className="space-y-2">
            <Label htmlFor="module-name">Module Name</Label>
            <Input id="module-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="module-description">Description</Label>
            <Textarea
              id="module-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Module Configuration */}
        <div className="space-y-4">
          <h3 className="font-medium">Configuration</h3>

          {Object.entries(config).map(([key, value]) => renderConfigField(key, value))}
        </div>

        {/* Module-specific settings */}
        {module.type === "sentiment-analysis" && (
          <div className="space-y-4">
            <h3 className="font-medium">Model Settings</h3>
            <div className="space-y-2">
              <Label>Model Type</Label>
              <Select value={config.model} onValueChange={(value) => updateConfig("model", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Model</SelectItem>
                  <SelectItem value="bert">BERT</SelectItem>
                  <SelectItem value="roberta">RoBERTa</SelectItem>
                  <SelectItem value="custom">Custom Model</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {module.type === "webhook" && (
          <div className="space-y-4">
            <h3 className="font-medium">HTTP Settings</h3>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={config.method} onValueChange={(value) => updateConfig("method", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4 border-t border-border">
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </div>
  )
}
