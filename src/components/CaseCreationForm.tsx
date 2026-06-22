'use client';

import { useState, useEffect } from 'react';

interface Case {
  id: string;
  identifyingTerms: string;
  createdAt: string;
}

export default function CaseCreationForm() {
  const [input, setInput] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        setCases(await res.json() as Case[]);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!input.trim()) {
      setError('Identifying terms cannot be empty');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifyingTerms: input })
      });
      
      if (res.ok) {
        setInput('');
        await fetchCases();
      } else {
        const data = await res.json() as { error: string };
        setError(data.error || 'Failed to create case');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="terms">Identifying Terms</label>
        <input
          id="terms"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="identifying terms"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Case'}
        </button>
      </form>
      {error && <div role="alert">{error}</div>}
      <div>
        <h2>Cases</h2>
        <ul>
          {cases.map(c => (
            <li key={c.id}>{c.identifyingTerms}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
