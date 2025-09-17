"use client"

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

const usageData = [
  { date: "2024-01-01", calls: 1200, latency: 245 },
  { date: "2024-01-02", calls: 1350, latency: 238 },
  { date: "2024-01-03", calls: 1180, latency: 252 },
  { date: "2024-01-04", calls: 1420, latency: 241 },
  { date: "2024-01-05", calls: 1680, latency: 235 },
  { date: "2024-01-06", calls: 1520, latency: 248 },
  { date: "2024-01-07", calls: 1750, latency: 243 },
]

const workflowData = [
  { name: "Sentiment Analysis", calls: 4200, percentage: 35 },
  { name: "Keyword Extraction", calls: 3100, percentage: 26 },
  { name: "Custom Model", calls: 2400, percentage: 20 },
  { name: "Data Processing", calls: 1500, percentage: 12 },
  { name: "Webhooks", calls: 800, percentage: 7 },
]

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function UsageAnalytics() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* API Usage Trend */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>API Usage Trend</CardTitle>
          <CardDescription>Daily API calls and average response time over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
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
