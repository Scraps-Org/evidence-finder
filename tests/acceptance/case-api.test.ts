import { describe, it, expect, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case Creation API Route', () => {
  const testId = `test-case-${Date.now()}-${Math.random()}`;

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { searchTerm: { contains: testId } },
    });
    await prisma.$disconnect();
  });

  it('inserts a new case into Vercel Postgres via Prisma on valid input', async () => {
    const searchTerm = `Valid Case ${testId}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerm }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.searchTerm).toBe(searchTerm);

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase!.searchTerm).toBe(searchTerm);
  });

  it('rejects empty searchTerm and does not insert a row', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerm: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('rejects whitespace-only searchTerm and does not insert a row', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ searchTerm: '   \n\t  ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
