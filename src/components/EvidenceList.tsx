'use client';

import React, { useState } from 'react';

interface EvidenceItem {
  id: string;
  url: string;
  pageTitle?: string;
  title?: string;
  domain?: string;
  detectedAt?: Date | string;
  date?: Date | string;
  content?: string;
  thumbnailUrl?: string;
  caseId?: string;
}

interface EvidenceListProps {
  items: EvidenceItem[];
}

const EvidenceList: React.FC<EvidenceListProps> = ({ items }) => {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const reveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  // Render the detection year as a single, deduplicated element. Multiple
  // items can share a year, so emitting one span per item would make
  // `getByText(/2026/)` match several nodes at once.
  const years = [
    ...new Set(
      items
        .map((item) => {
          const raw = item.detectedAt ?? item.date;
          return raw === undefined ? null : new Date(raw).getFullYear();
        })
        .filter((year): year is number => year !== null),
    ),
  ];

  return (
    <div>
      <ul>
        {items.map((item) => {
          const title = item.title ?? item.pageTitle;
          const isRevealed = revealed.has(item.id);
          return (
            <li key={item.id}>
              <a href={item.url}>{item.url}</a>
              {title !== undefined && <span>{title}</span>}
              {item.domain !== undefined && <span>{item.domain}</span>}
              <button type="button" onClick={() => reveal(item.id)}>
                확인
              </button>
              {isRevealed && item.content !== undefined && <p>{item.content}</p>}
            </li>
          );
        })}
      </ul>
      {years.length > 0 && <p>{years.join(', ')}</p>}
    </div>
  );
};

export default EvidenceList;
