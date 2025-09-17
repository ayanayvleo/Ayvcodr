"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export function UsageAnalytics() {
  const [apiUsageData, setApiUsageData] = useState<any[]>([])
  const [workflowData, setWorkflowData] = useState<any[]>([])
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  useEffect(() => {
    fetch("/dashboard/api-usage-trend")
      .then((res) => res.json())
      .then((data) => setApiUsageData(data))
      .catch(() => setApiUsageData([]))
    fetch("/dashboard/workflows")
      .then((res) => res.json())
      .then((data) => setWorkflowData(data))
      .catch(() => setWorkflowData([]))
  }, [])

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {/* API Usage Trend */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>API Usage Trend</CardTitle>
          <CardDescription>API calls and latency over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={apiUsageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
              <YAxis yAxisId="calls" orientation="left" />
              <YAxis yAxisId="latency" orientation="right" />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === "calls" ? `${value} calls` : `${value}ms`,
                  name === "calls" ? "API Calls" : "Avg Latency",
                ]}
              />
              <Line
                yAxisId="calls"
                type="monotone"
                dataKey="calls"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-1))" }}
              />
              <Line
                yAxisId="latency"
                type="monotone"
                dataKey="latency"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Workflow Usage Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Usage</CardTitle>
          <CardDescription>Distribution of API calls by workflow type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={workflowData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="calls"
              >
                {workflowData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} calls`, "Usage"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {workflowData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
                <Badge variant="secondary">{item.percentage}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Workflows</CardTitle>
          <CardDescription>Most frequently used workflows this month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={workflowData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => [`${value} calls`, "Usage"]} />
              <Bar dataKey="calls" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}