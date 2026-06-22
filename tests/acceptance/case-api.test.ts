import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

describe('D2-case-input: Case API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inserts case into database on valid POST request', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: 'Jane Smith' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    const data = await res.json() as { id: string; searchTerms: string };
    expect(data).toHaveProperty('id');
    expect(data.searchTerms).toBe('Jane Smith');
  });

  it('rejects request with empty searchTerms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: '' }),
    });

    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects request with whitespace-only searchTerms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerms: '   ' }),
    });

    const res = await POST(req);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
