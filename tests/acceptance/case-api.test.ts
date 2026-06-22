import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

describe('Case API Route', () => {
  it('should insert a case into the database on POST', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: 'Test Subject' }),
    });

    const res = await POST(req);
    const data = await res.json() as { success: boolean; caseId?: string };

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.caseId).toBeDefined();
  });

  it('should reject empty identifyingTerms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const res = await POST(req);
    const data = await res.json() as { success: boolean; error?: string };

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should reject whitespace-only identifyingTerms', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const res = await POST(req);
    const data = await res.json() as { success: boolean; error?: string };

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('should accept valid identifyingTerms and return caseId', async () => {
    const testTerms = `Test Case ${Date.now()}`;
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: testTerms }),
    });

    const res = await POST(req);
    const data = await res.json() as { success: boolean; caseId?: string };

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(typeof data.caseId).toBe('string');
  });
});
