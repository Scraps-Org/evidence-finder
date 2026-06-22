import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('POST /api/cases', () => {
  const createdIds: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    for (const id of createdIds) {
      await prisma.case.delete({ where: { id } }).catch(() => {});
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('inserts a case with identifyingTerms into the database', async () => {
    const testTerm = `case-${Date.now()}`;
    
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: testTerm })
    });
    
    const response = await POST(req);
    expect(response.status).toBe(201);
    
    const data = await response.json() as { id: string; identifyingTerms: string };
    createdIds.push(data.id);
    expect(data.identifyingTerms).toBe(testTerm);
    
    const found = await prisma.case.findUnique({ where: { id: data.id } });
    expect(found).toBeDefined();
    expect(found?.identifyingTerms).toBe(testTerm);
  });

  it('rejects empty identifying terms with 400 status and writes no row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' })
    });
    
    const countBefore = await prisma.case.count();
    const response = await POST(req);
    
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    
    const countAfter = await prisma.case.count();
    expect(countAfter).toBe(countBefore);
  });

  it('rejects null/missing identifyingTerms with 400 status', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const response = await POST(req);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });
});
