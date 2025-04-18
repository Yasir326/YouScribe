'use client'

import { useState } from 'react'
import { YoutubeForm } from '../components/YoutubeForm'
import { SummaryDisplay } from '../components/SummaryDisplay'

type Summary = {
  id: string
  content: string
}

interface DashboardClientProps {
  hasApiKey: boolean
}

export default function DashboardClient({ hasApiKey }: DashboardClientProps) {
  const [summary, setSummary] = useState<Summary | null>(null)

  const handleSummaryGenerated = (newSummary: Summary) => {
    setSummary(newSummary)
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-6 md:space-y-8">
      <div className="w-full px-2 sm:px-4">
        <YoutubeForm onSummaryGenerated={handleSummaryGenerated} hasApiKey={hasApiKey} />
      </div>
      <div className="w-full px-2 sm:px-4">
        <SummaryDisplay summary={summary} />
      </div>
    </div>
  )
}