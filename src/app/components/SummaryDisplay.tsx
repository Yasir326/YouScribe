"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/src/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/src/app/components/ui/card"
import { Download, ThumbsUp, Copy } from "lucide-react"
import { useToast } from "@/src/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import React from "react"
import { motion } from "framer-motion"

type Summary = {
  id: string
  content: string
}

export function SummaryDisplay({ summary }: { summary: Summary | null }) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const { toast } = useToast()

  const fetchLikeCount = useCallback(async () => {
    if (!summary) return

    try {
      const response = await fetch(`/api/like?summaryId=${summary.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch like count")
      }
      const data = await response.json()
      setLikeCount(data.likes)
    } catch (error) {
      console.error("Error fetching like count:", error)
      toast({
        title: "Error",
        description: "Failed to fetch like count",
        variant: "destructive",
      })
    }
  }, [summary, toast])

  useEffect(() => {
    if (summary) {
      fetchLikeCount()
    }
  }, [summary, fetchLikeCount])

  const handleLike = async () => {
    if (!summary) return

    try {
      const response = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summaryId: summary.id }),
      })

      if (!response.ok) {
        throw new Error("Failed to like summary")
      }

      const data = await response.json()
      setLikeCount(data.likes)
      setIsLiked(true)

      toast({
        title: "Success",
        description: "Summary liked!",
        variant: "default",
      })
    } catch (error) {
      console.error("Error liking summary:", error)
      toast({
        title: "Error",
        description: "Failed to like summary",
        variant: "destructive",
      })
    }
  }

  const handleCopy = async () => {
    if (!summary) return

    try {
      await navigator.clipboard.writeText(summary.content)
      toast({
        title: "Success",
        description: "Summary copied to clipboard!",
        variant: "default",
      })
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      toast({
        title: "Error",
        description: "Failed to copy summary",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    if (!summary) return

    const blob = new Blob([summary.content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "youtube-summary.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!summary) {
    return (
      <div className="text-center mt-8 text-gray-400">
        <p>No summary available. Please try generating a summary first.</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="mt-8 bg-gray-800 text-white border-gray-700">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLike}
                className={`text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-white ${isLiked ? "bg-purple-400 text-white" : ""}`}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <span className="text-sm text-purple-400">{likeCount}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-6 mb-4 text-white" {...props} />,
              p: ({ ...props }) => <p className="mb-4 text-gray-300" {...props} />,
              ol: ({ ...props }) => <ol className="list-none pl-0 mb-4 text-gray-300" {...props} />,
              li: ({ children, ...props }) => {
                const [number, ...rest] = React.Children.toArray(children)
                return (
                  <li className="mb-2 text-gray-300" {...props}>
                    <>{number} </>
                    {rest}
                  </li>
                )
              },
            }}
          >
            {summary.content}
          </ReactMarkdown>
        </CardContent>
      </Card>
    </motion.div>
  )
}