'use client'

import { useState } from 'react'
import { Button } from '@/src/app/components/ui/button'
import { Input } from '@/src/app/components/ui/input'
import { useToast } from '@/src/hooks/use-toast'

type Summary = {
  id: string
  content: string
}

export function YoutubeForm({ onSummaryGenerated }: { onSummaryGenerated: (summary: Summary) => void }) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="url"
        placeholder="Enter YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <div className="flex justify-center">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Summarize'}
        </Button>
      </div>
    </form>
  )
}