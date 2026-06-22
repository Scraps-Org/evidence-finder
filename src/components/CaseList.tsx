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
        const res = await fetch('/api/cases');
        if (res.ok) {
          const data = await res.json();
          setCases(data);
        }
      } catch (err) {
        console.error('Failed to fetch cases', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();

    const handleCaseCreated = () => {
      fetchCases();
    };

    window.addEventListener('case-created', handleCaseCreated);
    return () => window.removeEventListener('case-created', handleCaseCreated);
  }, []);

  if (isLoading) {
    return <div>Loading cases...</div>;
  }

  if (cases.length === 0) {
    return <div>No cases found</div>;
  }

  return (
    <div className="case-list">
      <h2>Cases</h2>
      <ul>
        {cases.map((c) => (
          <li key={c.id}>
            <div className="case-item">
              <strong>{c.identifyingTerms}</strong>
              <span className="case-id">ID: {c.id}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
