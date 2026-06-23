import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';

vi.mock('../../src/lib/db', () => {
  const createdRows: Array<{ id: string; identifyingTerms: string }> = [];
  return {
    prisma: {
      case: {
        create: vi.fn(async (args: { data: { identifyingTerms: string } }) => {
          const row = { id: String(createdRows.length + 1), identifyingTerms: args.data.identifyingTerms };
          createdRows.push(row);
          return row;
        }),
        findMany: vi.fn(async () => createdRows),
      },
    },
  };
});

describe('POST /api/cases route', () => {
  it('persists identifying terms and returns 201', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: 'Jane Smith' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json() as { identifyingTerms: string };
    expect(body.identifyingTerms).toBe('Jane Smith');
  });

  it('returns 400 for empty identifyingTerms', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for whitespace-only identifyingTerms', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   ' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
