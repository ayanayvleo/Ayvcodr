"use client"

import { useRef, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

export function ModelUploadFineTune({ onUpload, onFineTune }: { onUpload?: (file: File) => void, onFineTune?: (params: any) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fineTuning, setFineTuning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setProgress(30)
    // Simulate upload
    setTimeout(() => {
      setProgress(100)
      setUploading(false)
      onUpload?.(selectedFile)
    }, 1200)
  }

  const handleFineTune = async () => {
    setFineTuning(true)
    // Simulate fine-tuning
    setTimeout(() => {
      setFineTuning(false)
      onFineTune?.({ description })
    }, 2000)
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Upload Custom Model</CardTitle>
        <CardDescription>Upload a model file (e.g., .pt, .bin, .onnx) and optionally fine-tune it on your data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Input type="file" accept=".pt,.bin,.onnx,.zip" onChange={handleFileChange} ref={fileInputRef} />
          {selectedFile && <div className="text-sm mt-2">Selected: {selectedFile.name}</div>}
        </div>
        <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
          {uploading ? "Uploading..." : "Upload Model"}
        </Button>
        {uploading && <Progress value={progress} className="w-full" />}
        <div>
          <label className="block mb-1 font-medium">Fine-tuning Description (optional)</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe your fine-tuning objective or dataset..." />
        </div>
        <Button onClick={handleFineTune} disabled={fineTuning || uploading || !selectedFile} variant="secondary">
          {fineTuning ? "Fine-tuning..." : "Start Fine-tuning"}
        </Button>
      </CardContent>
    </Card>
  )
}
