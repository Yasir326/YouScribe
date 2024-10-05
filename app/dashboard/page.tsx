'use client'

import { useState } from 'react'
import { YoutubeForm } from '@/components/youtube-form'
import { SummaryDisplay } from '@/components/summary-display'
import { ThemeToggle } from '@/components/theme-toggle'

type Summary = {
  id: string
  content: string
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)

  const handleSummaryGenerated = (newSummary: Summary) => {
    console.log('New summary received:', newSummary)
    setSummary(newSummary)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">YouScribe</h1>
        <ThemeToggle />
      </div>
      <YoutubeForm onSummaryGenerated={handleSummaryGenerated} />
      <SummaryDisplay summary={summary} />
    </div>
  )
}