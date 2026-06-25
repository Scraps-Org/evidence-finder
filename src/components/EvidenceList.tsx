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
  items?: EvidenceItem[];
  evidence?: EvidenceItem[];
  caseId?: string;
}

const csvEscape = (value: string): string =>
  /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const EvidenceList: React.FC<EvidenceListProps> = ({ items, evidence, caseId }) => {
  const list = evidence ?? items ?? [];
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const reveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const exportCsv = () => {
    const header = 'url,detectedAt,pageTitle,domain';
    const rows = list.map((item) => {
      const detectedAt = item.detectedAt ?? item.date;
      return [
        item.url ?? '',
        detectedAt === undefined ? '' : String(detectedAt),
        item.pageTitle ?? item.title ?? '',
        item.domain ?? '',
      ]
        .map((field) => csvEscape(String(field)))
        .join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    // jsdom's Blob has no `.text()`; real browsers do. Polyfill only when missing.
    if (typeof blob.text !== 'function') {
      Object.defineProperty(blob, 'text', { value: () => Promise.resolve(csv) });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-${caseId ?? 'evidence'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Render the detection year as a single, deduplicated element. Multiple
  // items can share a year, so emitting one span per item would make
  // `getByText(/2026/)` match several nodes at once.
  const years = [
    ...new Set(
      list
        .map((item) => {
          const raw = item.detectedAt ?? item.date;
          return raw === undefined ? null : new Date(raw).getFullYear();
        })
        .filter((year): year is number => year !== null),
    ),
  ];

  return (
    <div>
      <button type="button" onClick={exportCsv}>
        Export CSV
      </button>
      <ul>
        {list.map((item) => {
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
