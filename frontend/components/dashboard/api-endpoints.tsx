"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Copy, ExternalLink, Play, CheckCircle, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface APIEndpoint {
  id: string
  workflowName: string
  endpoint: string
  method: string
  status: "active" | "inactive"
  calls: number
  lastCall: Date
  createdAt: Date
}

const mockEndpoints: APIEndpoint[] = [
  {
    id: "1",
    workflowName: "Customer Sentiment Analysis",
    endpoint: "https://api.example.com/v1/workflows/sentiment-analysis",
    method: "POST",
    status: "active",
    calls: 4200,
    lastCall: new Date("2024-01-07T10:30:00"),
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    workflowName: "Content Keyword Extraction",
    endpoint: "https://api.example.com/v1/workflows/keyword-extraction",
    method: "POST",
    status: "active",
    calls: 3100,
    lastCall: new Date("2024-01-06T15:45:00"),
    createdAt: new Date("2024-01-02"),
  },
]

export function APIEndpoints() {
  const [endpoints] = useState<APIEndpoint[]>(mockEndpoints)
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null)
  const [testInput, setTestInput] = useState('{"text": "This product is amazing!"}')
  const [testOutput, setTestOutput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const testEndpoint = async () => {
    if (!selectedEndpoint) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setTestOutput(
        JSON.stringify(
          {
            sentiment: "positive",
            confidence: 0.95,
            keywords: ["amazing", "product"],
            timestamp: new Date().toISOString(),
          },
          null,
          2,
        ),
      )
    } catch (error) {
      setTestOutput("Error: Failed to call API endpoint")
    } finally {
      setIsLoading(false)
    }
  }

  const generateCurlCommand = (endpoint: APIEndpoint) => {
    return `curl -X ${endpoint.method} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${testInput}' \\
  ${endpoint.endpoint}`
  }

  const generateJavaScriptCode = (endpoint: APIEndpoint) => {
    return `const response = await fetch('${endpoint.endpoint}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify(${testInput})
});

const data = await response.json();
console.log(data);`
  }

  const generatePythonCode = (endpoint: APIEndpoint) => {
    return `import requests
import json

url = "${endpoint.endpoint}"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = ${testInput}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)
result = response.json()
print(result)`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">API Endpoints</h2>
        <p className="text-muted-foreground">Manage and test your deployed workflow endpoints</p>
      </div>

      <div className="grid gap-4">
        {endpoints.map((endpoint) => (
          <Card key={endpoint.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{endpoint.workflowName}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{endpoint.method}</Badge>
                    <Badge
                      className={
                        endpoint.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {endpoint.status === "active" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      )}
                      {endpoint.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedEndpoint(endpoint)}>
                        <Play className="h-4 w-4 mr-2" />
                        Test
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Test API Endpoint</DialogTitle>
                        <DialogDescription>
                          Test your {endpoint.workflowName} endpoint and view code examples
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="test" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="test">Test</TabsTrigger>
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                          <TabsTrigger value="python">Python</TabsTrigger>
                        </TabsList>

                        <TabsContent value="test" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Request Body</label>
                              <Textarea
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                rows={8}
                                className="font-mono text-sm"
                              />
                              <Button onClick={testEndpoint} disabled={isLoading} className="w-full">
                                {isLoading ? "Testing..." : "Send Request"}
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Response</label>
                              <Textarea
                                value={testOutput}
                                readOnly
                                rows={8}
                                className="font-mono text-sm"
                                placeholder="Response will appear here..."
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="curl">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">cURL Command</label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(generateCurlCommand(endpoint))}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{generateCurlCommand(endpoint)}</code>
                            </pre>
                          </div>
                        </TabsContent>

                        <TabsContent value="javascript">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">JavaScript Code</label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(generateJavaScriptCode(endpoint))}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{generateJavaScriptCode(endpoint)}</code>
                            </pre>
                          </div>
                        </TabsContent>

                        <TabsContent value="python">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Python Code</label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(generatePythonCode(endpoint))}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                            </div>
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{generatePythonCode(endpoint)}</code>
                            </pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(endpoint.endpoint)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy URL
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <code className="text-sm">{endpoint.endpoint}</code>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{endpoint.calls.toLocaleString()} total calls</span>
                <span>Last used: {endpoint.lastCall.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
