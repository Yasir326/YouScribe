'use client';

import { useState, useEffect } from 'react';
import { YoutubeForm } from '@/src/app/components/YoutubeForm';
import { SummaryDisplay } from '@/src/app/components/SummaryDisplay';
import SideMenu from '@/src/app/components/SideMenu';

type Summary = {
  id: string;
  title: string;
  content: string;
};

export default function DashboardClient() {
  const [, setSummary] = useState<Summary | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]); // New state to store all summaries
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const res = await fetch('/api/summaries'); // Endpoint to get summaries
        const data = await res.json();
        setSummaries(data);
      } catch (error) {
        console.error('Error fetching summaries:', error);
      }
    };
    fetchSummaries();
  }, [])

  const handleSelectSummary = (id: string) => {
    const selected = summaries.find((s) => s.id === id);
    if (selected) {
      setSelectedSummary(selected);
    }
  };

  const handleSummaryGenerated = (newSummary: Summary) => {
    setSummary(newSummary);
  };

  return (
    <div className="flex">
      <SideMenu summaries={summaries} onSelectSummary={handleSelectSummary} />
      <div className="flex-grow p-4">
        <YoutubeForm onSummaryGenerated={handleSummaryGenerated} />
        {selectedSummary && <SummaryDisplay summary={selectedSummary} />}
      </div>
    </div>
  );
}
