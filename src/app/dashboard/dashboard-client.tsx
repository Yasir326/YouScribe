'use client'

import { useState, useEffect } from 'react'
import { YoutubeForm } from '@/src/app/components/YoutubeForm'
import { SummaryDisplay } from '@/src/app/components/SummaryDisplay'
import SummaryList from '@/src/app/components/SummaryList'

interface Summary {
  id: string;
  content: string;
  title: string;
  url: string;
  date: string;
}

export default function DashboardClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        const response = await fetch('/api/summaries');
        if (!response.ok) {
          throw new Error('Failed to fetch summaries');
        }
        const latestSummaries = await response.json();
        setSummaries(latestSummaries);
      } catch (error) {
        console.error('Error fetching summaries:', error);
      }
    };

    loadSummaries();
  }, [refreshTrigger]);

  const handleSummaryGenerated = (newSummary: { id: string; content: string }) => {
    console.log('New summary received:', newSummary);
    setSummary({
      ...newSummary,
      title: '', // Add a default value or fetch from somewhere
      url: '',   // Add a default value or fetch from somewhere
      date: new Date().toISOString() // Use current date or fetch from somewhere
    });
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div>
      <YoutubeForm onSummaryGenerated={handleSummaryGenerated} />
      <SummaryDisplay summary={summary} />
      <SummaryList summaries={summaries} />
    </div>
  )
}

