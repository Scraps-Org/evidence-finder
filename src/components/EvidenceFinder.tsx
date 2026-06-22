import React, { useState } from 'react';

export default function EvidenceFinder() {
  const [terms, setTerms] = useState('');
  const [cases, setCases] = useState<{ id: string; terms: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms.trim()) return;

    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms }),
    });

    if (res.ok) {
      const data = await res.json();
      setCases([...cases, data]);
      setTerms('');
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <input 
          role="textbox"
          value={terms} 
          onChange={(e) => setTerms(e.target.value)} 
          placeholder="Enter identifying terms..."
        />
        <button type="submit">Save Case</button>
      </form>
      <ul>
        {cases.map(c => <li key={c.id}>{c.terms}</li>)}
      </ul>
    </div>
  );
}