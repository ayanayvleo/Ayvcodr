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

export function OverviewStats() {
  const stats = [
    {
      title: "Total API Calls",
      value: "12,847",
      description: "Last 30 days",
      trend: { value: 12.5, isPositive: true },
      icon: <Activity className="h-4 w-4" />,
    },
    {
      title: "Active Workflows",
      value: "8",
      description: "Currently deployed",
      trend: { value: 2, isPositive: true },
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "Cost Savings",
      value: "$2,847",
      description: "vs traditional development",
      trend: { value: 23.1, isPositive: true },
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Avg Response Time",
      value: "247ms",
      description: "Last 24 hours",
      trend: { value: 5.2, isPositive: false },
      icon: <Clock className="h-4 w-4" />,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}
