"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Activity, Zap, DollarSign, Clock } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  description: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon: React.ReactNode
}

function StatCard({ title, value, description, trend, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{description}</span>
          {trend && (
            <Badge variant={trend.isPositive ? "default" : "secondary"} className="text-xs">
              {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(trend.value)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { useEffect, useState } from "react"

export function OverviewStats() {
  const [stats, setStats] = useState<any[]>([])
  useEffect(() => {
    fetch("/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats([
          {
            title: "Total API Calls",
            value: data.total_api_calls?.toLocaleString() ?? "-",
            description: "Last 30 days",
            trend: { value: data.api_calls_trend ?? 0, isPositive: (data.api_calls_trend ?? 0) >= 0 },
            icon: <Activity className="h-4 w-4" />,
          },
          {
            title: "Active Workflows",
            value: data.active_workflows?.toString() ?? "-",
            description: "Currently deployed",
            trend: { value: data.active_workflows_trend ?? 0, isPositive: (data.active_workflows_trend ?? 0) >= 0 },
            icon: <Zap className="h-4 w-4" />,
          },
          {
            title: "Cost Savings",
            value: data.cost_savings ? `$${data.cost_savings}` : "-",
            description: "vs traditional development",
            trend: { value: data.cost_savings_trend ?? 0, isPositive: (data.cost_savings_trend ?? 0) >= 0 },
            icon: <DollarSign className="h-4 w-4" />,
          },
          {
            title: "Avg Response Time",
            value: data.avg_response_time ? `${data.avg_response_time}ms` : "-",
            description: "Last 24 hours",
            trend: { value: data.response_time_trend ?? 0, isPositive: (data.response_time_trend ?? 0) >= 0 },
            icon: <Clock className="h-4 w-4" />,
          },
        ])
      })
      .catch(() => {
        setStats([])
      })
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
