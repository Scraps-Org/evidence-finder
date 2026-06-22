import { describe, it, expect, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

describe('Case API Route', () => {
  it('inserts a valid case into the database', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: 'Test Case Name' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(201);

    const data = await response.json() as { id: string; identifyingTerms: string };
    expect(data.id).toBeDefined();
    expect(data.identifyingTerms).toBe('Test Case Name');
  });

  it('rejects empty identifying terms', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);

    const data = await response.json() as { error: string };
    expect(data.error).toBeDefined();
  });

  it('rejects whitespace-only identifying terms', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });

  it('returns error for missing identifying terms field', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(400);
  });
});
