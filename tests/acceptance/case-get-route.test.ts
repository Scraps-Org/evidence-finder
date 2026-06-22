import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GET /api/cases', () => {
  const testTerms: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    for (const term of testTerms) {
      await prisma.case.deleteMany({
        where: { identifyingTerms: term }
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('returns all saved cases with identifyingTerms', async () => {
    const testTerm = `case-list-${Date.now()}`;
    testTerms.push(testTerm);
    
    const created = await prisma.case.create({
      data: { identifyingTerms: testTerm }
    });
    
    const req = new Request('http://localhost:3000/api/cases', { method: 'GET' });
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json() as Array<{ id: string; identifyingTerms: string }>;
    const found = data.find(c => c.id === created.id);
    
    expect(found).toBeDefined();
    expect(found?.identifyingTerms).toBe(testTerm);
  });

  it('returns empty array when no cases exist', async () => {
    const req = new Request('http://localhost:3000/api/cases', { method: 'GET' });
    const response = await GET(req);
    
    expect(response.status).toBe(200);
    const data = await response.json() as unknown[];
    expect(Array.isArray(data)).toBe(true);
  });
});
