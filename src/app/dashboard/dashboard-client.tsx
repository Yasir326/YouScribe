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
    console.log('New summary received:', newSummary)
    setSummary(newSummary)
  }

  return (
    <div>
      <YoutubeForm onSummaryGenerated={handleSummaryGenerated} hasApiKey={hasApiKey} />
      <SummaryDisplay summary={summary} />
    </div>
  )
}