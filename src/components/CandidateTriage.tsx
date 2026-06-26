'use client';

import { useEffect, useState } from 'react';

type Candidate = {
  id: string;
  url: string;
  title: string;
  status: string;
  caseId: string;
};

export default function CandidateTriage(props: { params: Promise<{ caseId: string }> }) {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    let active = true;
    props.params.then(({ caseId }) => {
      if (active) {
        setCaseId(caseId);
      }
    });
    return () => {
      active = false;
    };
  }, [props.params]);

  useEffect(() => {
    if (!caseId) {
      return;
    }
    let active = true;
    fetch('/api/cases/' + caseId + '/candidates')
      .then((res) => res.json())
      .then((data: Candidate[]) => {
        if (active) {
          setCandidates(data);
        }
      });
    return () => {
      active = false;
    };
  }, [caseId]);

  function triage(id: string, status: string) {
    fetch('/api/candidates/' + id, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <ul>
      {candidates.map((candidate) => (
        <li key={candidate.id}>
          <span>{candidate.title}</span>
          <button type="button" onClick={() => triage(candidate.id, 'evidence')}>
            Confirm
          </button>
          <button type="button" onClick={() => triage(candidate.id, 'dismissed')}>
            Dismiss
          </button>
        </li>
      ))}
    </ul>
  );
}
