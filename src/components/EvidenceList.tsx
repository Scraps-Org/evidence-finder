`use client`;

import React from 'react';

interface EvidenceItem {
  id: string;
  url: string;
  pageTitle: string;
  domain: string;
  detectedAt: Date | string;
  caseId: string;
}

interface EvidenceListProps {
  items: EvidenceItem[];
}

const EvidenceList: React.FC<EvidenceListProps> = ({ items }) => {
  const years = items.map((item) => new Date(item.detectedAt).getFullYear());
  const uniqueYears = [...new Set(years)];

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <a href={item.url}>{item.url}</a>
          <span>{item.pageTitle}</span>
          <span>{item.domain}</span>
        </div>
      ))}
      <p>{uniqueYears.join(', ')}</p>
    </div>
  );
};

export default EvidenceList;
