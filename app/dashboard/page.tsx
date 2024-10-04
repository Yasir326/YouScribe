'use client'

import { useState } from 'react'
import { YoutubeForm } from '@/components/youtube-form'
import { SummaryDisplay } from '@/components/summary-display'

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSummaryGenerated = (newSummary: any) => {
    setSummary(newSummary)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">YouScribe</h1>
      <YoutubeForm onSummaryGenerated={handleSummaryGenerated} />
      <SummaryDisplay summary={summary} />
    </div>
  )
}