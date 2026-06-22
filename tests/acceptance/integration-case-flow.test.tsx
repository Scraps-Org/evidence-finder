import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST } from '../../src/app/api/cases/route';

const prisma = new PrismaClient();

describe('End-to-End Case Creation Flow [D2-case-input]', () => {
  const testTimestamp = Date.now().toString();

  beforeEach(async () => {
    await prisma.case.deleteMany();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany();
    vi.restoreAllMocks();
  });

  it('[Full Flow] should create case through form, API, and display in list', async () => {
    const caseTerms = `Integration Test ${testTimestamp}`;

    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: caseTerms })
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.identifyingTerms).toBe(caseTerms);

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id }
    });

    expect(savedCase?.identifyingTerms).toBe(caseTerms);
  });
}
