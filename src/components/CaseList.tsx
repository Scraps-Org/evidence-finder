'use client';

import { useEffect, useState } from 'react';

interface Case {
  id: string;
  identifyingTerms: string;
  createdAt: string;
}

export default function CaseList() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('/api/cases');
        if (response.ok) {
          const data = await response.json() as Case[];
          setCases(data);
        }
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, []);

  if (isLoading) {
    return <p>Loading cases...</p>;
  }

  if (cases.length === 0) {
    return <p>No cases found</p>;
  }

  return (
    <ul>
      {cases.map((caseItem) => (
        <li key={caseItem.id}>{caseItem.identifyingTerms}</li>
      ))}
    </ul>
  );
}
