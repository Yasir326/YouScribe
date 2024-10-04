'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, ThumbsUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Summary = {
  id: string
  content: string
  actionSteps: string[]
}

export function SummaryDisplay({ summary }: { summary: Summary | null }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (summary) {
      fetchLikeCount()
    }
  },)

  const fetchLikeCount = async () => {
    if (!summary) return

    try {
      const response = await fetch(`/api/like?summaryId=${summary.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch like count')
      }
      const data = await response.json()
      setLikeCount(data.likes)
    } catch (error) {
      console.error('Error fetching like count:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch like count',
        variant: 'destructive',
      })
    }
  }

  const handleLike = async () => {
    if (!summary) return

    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryId: summary.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to like summary')
      }

      const data = await response.json()
      setLikeCount(data.likes)
      setIsLiked(true)

      toast({
        title: 'Success',
        description: 'Summary liked!',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error liking summary:', error)
      toast({
        title: 'Error',
        description: 'Failed to like summary',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = () => {
    if (!summary) return

    const content = `
Summary:
${summary.content}

Action Steps:
${summary.actionSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'youtube-summary.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!summary) {
    return (
      <div className="text-center mt-8">
        <p>Enter a YouTube URL to generate a summary.</p>
      </div>
    )
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Summary
          <div className="space-x-2">
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLike}
              className={isLiked ? 'text-blue-500' : ''}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>
            <span className="text-sm">{likeCount}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">Content Summary:</h3>
        <p>{summary.content}</p>
        <h3 className="font-semibold mt-4 mb-2">Action Steps:</h3>
        <ul className="list-disc pl-5">
          {summary.actionSteps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}