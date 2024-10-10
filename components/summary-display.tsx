/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, ThumbsUp, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import React from 'react'

type Summary = {
  id: string
  content: string
}

export function SummaryDisplay({ summary }: { summary: Summary | null }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (summary) {
      fetchLikeCount()
    }
  }, [summary])

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

  const handleCopy = async () => {
    if (!summary) return

    try {
      await navigator.clipboard.writeText(summary.content)
      toast({
        title: 'Success',
        description: 'Summary copied to clipboard!',
        variant: 'default',
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy summary',
        variant: 'destructive',
      })
    }
  }

  const handleDownload = () => {
    if (!summary) return

    const blob = new Blob([summary.content], { type: 'text/plain' })
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
        <p>No summary available. Please try generating a summary first.</p>
      </div>
    )
  }

  return (
    <Card className="mt-8 bg-background text-foreground">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="space-x-2">
            <Button variant="outline" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
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
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({...props}) => <h2 className="text-2xl font-bold mt-6 mb-4 text-foreground" {...props} />,
            p: ({...props}) => <p  className="mb-4 text-foreground" {...props} />,
            ol: ({...props}) => <ol className="list-none pl-0 mb-4 text-foreground" {...props} />,
            li: ({children, ...props}) => {
              const [number, ...rest] = React.Children.toArray(children);
              return (
                <li className="mb-2 text-foreground" {...props}>
                  <>{number} </>
                  {rest}
                </li>
              );
            },
          }}
        >
          {summary.content}
        </ReactMarkdown>
      </CardContent>
    </Card>
  )
}