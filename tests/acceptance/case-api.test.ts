import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case API Route', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('should accept POST request with identifying terms and return 201', async () => {
    const payload = {
      identifyingTerms: 'Test Case 001',
    };

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.identifyingTerms).toBe('Test Case 001');
  });

  it('should insert case into database via Prisma', async () => {
    const payload = {
      identifyingTerms: 'Searchable Case Name',
    };

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json();
    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });

    expect(savedCase).not.toBeNull();
    expect(savedCase!.identifyingTerms).toBe('Searchable Case Name');
  });

  it('should reject empty identifying terms with 400 status', async () => {
    const payload = {
      identifyingTerms: '',
    };

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const caseCount = await prisma.case.count();
    expect(caseCount).toBe(0);
  });

  it('should reject whitespace-only identifying terms with 400 status', async () => {
    const payload = {
      identifyingTerms: '   \t\n  ',
    };

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const caseCount = await prisma.case.count();
    expect(caseCount).toBe(0);
  });

  it('should not insert row when validation fails', async () => {
    const invalidPayload = {
      identifyingTerms: '',
    };

    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(invalidPayload),
    });

    await POST(request);

    const cases = await prisma.case.findMany();
    expect(cases).toHaveLength(0);
  });
});
