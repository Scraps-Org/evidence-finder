import React, { useState, useEffect } from 'react';

export function EvidenceFinder() {
  const [terms, setTerms] = useState('');
  const [cases, setCases] = useState<{id: string, terms: string}[]>([]);

  const fetchCases = async () => {
    try {
      const res = await fetch('/api/cases');
      const data = await res.json();
      setCases(data);
    } catch (e) {}
  };

  useEffect(() => { fetchCases(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terms.trim()) return;
    
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms }),
    });
    
    if (res.ok) {
      setTerms('');
      await fetchCases();
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input 
          role="textbox"
          value={terms} 
          onChange={(e) => setTerms(e.target.value)} 
          placeholder="Enter identifying terms"
          className="border p-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">Save Case</button>
      </form>
      <ul className="list-disc pl-5">
        {cases.map(c => <li key={c.id}>{c.terms}</li>)}
      </ul>
    </div>
  );
}