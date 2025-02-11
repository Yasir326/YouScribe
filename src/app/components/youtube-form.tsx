'use client'

import { useState } from 'react'
import { Button } from '@/src/app/components/ui/button'
import { Input } from '@/src/app/components/ui/input'
import { useToast } from '@/src/hooks/use-toast'
import { LoadingAnimation } from './loading-animation'
import { ChatComponent } from './ChatComponent'

type Summary = {
  id: string
  content: string
}

export function YoutubeForm({ onSummaryGenerated }: { onSummaryGenerated: (summary: Summary) => void }) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'An error occurred while processing the request')
      }

      const data = await response.json()
      setSummary(data.summary)
      setTranscript(data.transcript)
      onSummaryGenerated(data.summary)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred while processing the request',
        variant: 'destructive',
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="url"
          placeholder="Enter YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <div className="flex justify-center">
          {isLoading ? (
            <LoadingAnimation />
          ) : (
            <Button type="submit">Summarize</Button>
          )}
        </div>
      </form>

      {summary && (
        <div className="flex flex-col md:flex-row mt-8 gap-4">
          <div className="w-full md:w-1/2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${extractVideoId(url)}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="w-full md:w-1/2">
            <ChatComponent summary={summary.content} transcript={transcript} />
          </div>
        </div>
      )}
    </div>
  )
}
