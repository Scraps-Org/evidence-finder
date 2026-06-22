import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

describe('POST /api/cases - Case Creation API Route', () => {
  beforeEach(() => {
    // Reset any module state if needed
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('inserts a case with identifying terms into the database and returns 201', async () => {
    const identifyingTerms = `test-case-${Date.now()}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json() as { id: string; identifyingTerms: string };
    expect(data.identifyingTerms).toBe(identifyingTerms);
  });

  it('rejects empty identifying terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('rejects whitespace-only identifying terms with 400 error', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
