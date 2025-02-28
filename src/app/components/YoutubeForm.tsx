"use client"

import { useState } from "react"
import { Button } from "@/src/app/components/ui/button"
import { Input } from "@/src/app/components/ui/input"
import { useToast } from "@/src/hooks/use-toast"
import { ChatComponent } from "./ChatComponent"
import { motion } from "framer-motion"
import { Youtube, Key } from "lucide-react"
import { LoadingAnimation } from './LoadingAnimation'

type Summary = {
  id: string
  content: string
}

interface YoutubeFormProps {
  onSummaryGenerated: (summary: Summary) => void
  hasApiKey: boolean
}

export function YoutubeForm({ onSummaryGenerated, hasApiKey }: YoutubeFormProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const { toast } = useToast()

  if (!hasApiKey) {
    return (
      <div className="text-center p-4 sm:p-6 bg-gray-800 rounded-lg">
        <Key className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2">OpenAI API Key Required</h3>
        <p className="text-sm sm:text-base text-gray-400">Please configure your OpenAI API key in the settings above to use the summarization feature.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "An error occurred while processing the request")
      }

      const data = await response.json()
      setSummary(data.summary)
      setTranscript(data.transcript)
      onSummaryGenerated(data.summary)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred while processing the request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const extractVideoId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/)
    return match ? match[1] : null
  }

  return (
    <div className="space-y-4 sm:space-y-6 bg-black/[0.96] antialiased bg-grid-white/[0.02] relative overflow-hidden p-4 sm:p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="url"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="bg-gray-800 text-white border-gray-700 focus:border-purple-500"
        />
        <div className="flex justify-center">
          {isLoading ? (
            <LoadingAnimation />
          ) : (
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              <Youtube className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Summarize
            </Button>
          )}
        </div>
      </form>

      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col mt-6 sm:mt-8 gap-4"
        >
          <div className="w-full bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="relative pb-[56.25%] h-0 overflow-hidden rounded">
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${extractVideoId(url)}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="w-full">
            <ChatComponent summary={summary.content} transcript={transcript} />
          </div>
        </motion.div>
      )}
    </div>
  )
}