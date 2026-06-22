import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { POST } from '../../src/app/api/cases/route';

const prisma = new PrismaClient();

describe('Case API Route [D2-case-input]', () => {
  const testTimestamp = Date.now().toString();

  beforeEach(async () => {
    await prisma.case.deleteMany();
  });

  afterEach(async () => {
    await prisma.case.deleteMany();
  });

  it('[Criterion 2] should insert case into database on valid request', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: `Test Case ${testTimestamp}` })
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.identifyingTerms).toBe(`Test Case ${testTimestamp}`);

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id }
    });

    expect(savedCase).toBeDefined();
    expect(savedCase?.identifyingTerms).toBe(`Test Case ${testTimestamp}`);
  });

  it('[Criterion 5c] should reject empty string and not insert row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toMatch(/cannot be empty|required|invalid/i);

    const caseCount = await prisma.case.count();
    expect(caseCount).toBe(0);
  });

  it('[Criterion 5d] should reject whitespace-only input and not insert row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   \t\n  ' })
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data).toHaveProperty('error');

    const caseCount = await prisma.case.count();
    expect(caseCount).toBe(0);
  });

  it('should handle missing identifyingTerms field', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({})
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const caseCount = await prisma.case.count();
    expect(caseCount).toBe(0);
  });
}
