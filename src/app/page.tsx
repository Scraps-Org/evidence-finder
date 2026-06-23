'use client';

import { FormEvent, useState } from 'react';

type Case = {
  id: string;
  identifyingTerms: string;
};

export default function Page() {
  const [term, setTerm] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!term.trim()) return;

    setError(null);
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: term }),
    });

    if (!res.ok) {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Request failed');
      return;
    }

    const created = await res.json() as Case;
    setCases((prev) => [...prev, created]);
    setTerm('');
  }

  return (
    <main>
      <h1>Cases</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          aria-label="Identifying terms"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button type="submit">Create</button>
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
