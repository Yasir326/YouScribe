import React from 'react';

type Summary = {
  id: string;
  title: string;
  content: string;
};

type SideMenuProps = {
  summaries: Summary[];
  onSelectSummary: (id: string) => void;
};

export default function SideMenu({ summaries, onSelectSummary }: SideMenuProps) {
  return (
    <div className="w-64 h-full bg-gray-100 p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Summaries</h2>
      <ul>
        {summaries.map((summary) => (
          <li
            key={summary.id}
            onClick={() => onSelectSummary(summary.id)}
            className="cursor-pointer mb-2 p-2 hover:bg-gray-200 rounded"
          >
            {summary.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
