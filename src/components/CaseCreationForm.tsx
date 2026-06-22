'use client';

import { useState } from 'react';

export default function CaseCreationForm({ onCaseCreated }: { onCaseCreated: () => void }) {
  const [value, setValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (value.trim() === '') {
      return;
    }

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        body: JSON.stringify({ identifyingTerms: value }),
        headers: {
          'content-type': 'application/json',
        },
      });

      if (response.ok) {
        onCaseCreated();
        setValue('');
      }
    } catch (error) {
      // Handle error if needed
      console.error('Failed to create case:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="identifying-terms">Identifying terms</label>
      <input
        id="identifying-terms"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Create case</button>
    </form>
  );
}
