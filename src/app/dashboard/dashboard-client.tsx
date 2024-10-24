'use client'

import { useState } from 'react'
import { YoutubeForm } from '@/src/app/components/YoutubeForm'
import { SummaryDisplay } from '@/src/app/components/SummaryDisplay'

type Summary = {
  id: string
  content: string
}

export default function DashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null)

  const handleSummaryGenerated = (newSummary: Summary) => {
    console.log('New summary received:', newSummary)
    setSummary(newSummary)
  }

  return (
    <div>
      <YoutubeForm onSummaryGenerated={handleSummaryGenerated} />
      <SummaryDisplay summary={summary} />
    </div>
  )
}
