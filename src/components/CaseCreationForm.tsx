'use client';

import { useState } from 'react';

export default function CaseCreationForm() {
  const [identifyingTerms, setIdentifyingTerms] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifyingTerms.trim()) {
      setError('Identifying terms cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifyingTerms }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        setError(data.error || 'Failed to create case');
        return;
      }

      setIdentifyingTerms('');
    } catch (err) {
      setError('Failed to create case');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="identifyingTerms">Identifying Terms</label>
        <input
          id="identifyingTerms"
          type="text"
          value={identifyingTerms}
          onChange={(e) => setIdentifyingTerms(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
