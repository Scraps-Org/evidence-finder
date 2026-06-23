'use client';

import { useState, useEffect, FormEvent } from 'react';

type Case = { id: number; identifyingTerms: string };

export default function Page() {
  const [identifyingTerms, setIdentifyingTerms] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [error, setError] = useState('');

  const loadCases = async () => {
    const res = await fetch('/api/cases/list');
    if (res.ok) {
      const data = (await res.json()) as Case[];
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
      body: JSON.stringify({ identifyingTerms }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? 'Error');
      return;
    }
    const created = (await res.json()) as Case;
    setCases((prev) => [created, ...prev]);
    setIdentifyingTerms('');
  };

  return (
    <main>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <label htmlFor="identifyingTerms">Identifying Terms</label>
        <input
          id="identifyingTerms"
          type="text"
          value={identifyingTerms}
          onChange={(e) => setIdentifyingTerms(e.target.value)}
        />
        <button type="submit">Create Case</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <ul>
        {cases.map((c) => (
          <li key={c.id}>{c.identifyingTerms}</li>
        ))}
      </ul>
    </main>
  );
}
