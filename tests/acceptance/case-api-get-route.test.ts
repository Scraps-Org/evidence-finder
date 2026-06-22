import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GET, POST } from '../../src/app/api/cases/route';

const prisma = new PrismaClient();

describe('Case API GET Route [D2-case-input]', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany();
  });

  afterEach(async () => {
    await prisma.case.deleteMany();
  });

  it('[Criterion 4] should return saved cases from database', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: 'Test Case 1' })
    });

    const postRes = await POST(req);
    const postData = await postRes.json();

    const getReq = new Request('http://localhost:3000/api/cases');
    const getRes = await GET(getReq);
    expect(getRes.status).toBe(200);

    const cases = await getRes.json();
    expect(Array.isArray(cases)).toBe(true);
    expect(cases.length).toBe(1);
    expect(cases[0].identifyingTerms).toBe('Test Case 1');
    expect(cases[0].id).toBe(postData.id);
  });

  it('should return empty array when no cases exist', async () => {
    const req = new Request('http://localhost:3000/api/cases');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const cases = await res.json();
    expect(Array.isArray(cases)).toBe(true);
    expect(cases.length).toBe(0);
  });
}
