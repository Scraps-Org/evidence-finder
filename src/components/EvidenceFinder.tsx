'use client';

import { useState, useEffect, FormEvent } from 'react';

interface Case {
  id: string;
  identifyingTerms: string;
}

export default function EvidenceFinder() {
  const [cases, setCases] = useState<Case[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const loadCases = async () => {
    const res = await fetch('/api/cases');
    if (res.ok) {
      const data = await res.json() as Case[];
      setCases(data);
    }
  };

  useEffect(() => {
    void loadCases();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: input }),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Submission failed');
      return;
    }
    setInput('');
    await loadCases();
  };

  return (
    <div>
      <form onSubmit={(e) => { void handleSubmit(e); }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter identifying terms"
          aria-label="Identifying terms"
        />
        <button type="submit">Submit</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ul>
        {cases.map((c) => (
          <li key={c.id}>{c.identifyingTerms}</li>
        ))}
      </ul>
    </div>
  );
}
