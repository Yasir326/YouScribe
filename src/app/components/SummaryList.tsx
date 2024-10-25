import React from 'react';
import Link from 'next/link';
import {
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline';
import { Sidebar, SidebarProvider } from '@/src/app/components/ui/sidebar';

interface Summary {
  id: string;
  title: string;
  date: string;
}

interface SummaryListProps {
  summaries: Summary[];
}

const SummaryList: React.FC<SummaryListProps> = ({ summaries }) => {
  const groupedSummaries = groupSummariesByDate(summaries);

  return (
    <SidebarProvider>
      <Sidebar className='w-64'>
        <div className='p-4'>
          <h2 className='text-lg font-semibold'>Summaries</h2>
          {Object.entries(groupedSummaries).map(([date, dateSummaries]) => (
            <div key={date} className='relative mt-5 first:mt-0 last:mb-5'>
              <div className='sticky top-0 bg-sidebar-surface-primary'>
                <span className='flex h-9 items-center'>
                  <h3 className='px-2 text-xs font-semibold text-ellipsis overflow-hidden break-all pt-3 pb-2'>
                    {date}
                  </h3>
                </span>
              </div>
              <ol>
                {dateSummaries.map((summary, index) => (
                  <li
                    key={summary.id}
                    className='relative'
                    data-testid={`history-item-${index}`}
                  >
                    <div className='group relative rounded-lg active:opacity-90 hover:bg-sidebar-surface-secondary'>
                      <Link
                        href={`/summary/${summary.id}`}
                        className='flex items-center gap-2 p-2'
                      >
                        <div className='h-6 w-6 flex-shrink-0'>
                          <ChatBubbleLeftIcon className='h-6 w-6' />
                        </div>
                        <div className='relative grow overflow-hidden text-ellipsis whitespace-nowrap text-sm'>
                          {summary.title}
                        </div>
                      </Link>
                      <div className='absolute bottom-0 top-0 items-center gap-1.5 pr-2 right-0 hidden group-hover:flex'>
                        <span data-state='closed'>
                          <button className='flex items-center justify-center transition hover:text-primary'>
                            <EllipsisHorizontalIcon className='h-5 w-5' />
                          </button>
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Sidebar>
    </SidebarProvider>
  );
};

function groupSummariesByDate(summaries: Summary[]): Record<string, Summary[]> {
  return summaries.reduce((acc, summary) => {
    const date = new Date(summary.date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(summary);
    return acc;
  }, {} as Record<string, Summary[]>);
}

export default SummaryList;
