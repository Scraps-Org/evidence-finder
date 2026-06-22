'use client';

import { useState } from 'react';

export default function CaseCreationForm() {
  const [identifyingTerms, setIdentifyingTerms] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = identifyingTerms.trim();
    if (!trimmed) {
      setError('Identifying terms cannot be empty');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifyingTerms: trimmed })
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create case');
        return;
      }

      setIdentifyingTerms('');
      window.dispatchEvent(new CustomEvent('case-created'));
    } catch (err) {
      setError('Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="case-creation-form">
      <div className="form-group">
        <label htmlFor="identifying-terms">Identifying Terms</label>
        <input
          id="identifying-terms"
          type="text"
          value={identifyingTerms}
          onChange={(e) => setIdentifyingTerms(e.target.value)}
          disabled={isSubmitting}
          aria-invalid={!!error}
          placeholder="Enter case name or identifier"
        />
        {error && <div className="error-message" role="alert">{error}</div>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Case'}
      </button>
    </form>
  );
}
