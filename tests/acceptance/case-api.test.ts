import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case API Route (POST /api/cases)', () => {
  beforeEach(() => {
    // Clear any test data before each test
  });

  afterEach(async () => {
    // Clean up test data after each test
    const timestamp = new Date().getTime().toString();
    await prisma.case.deleteMany({
      where: {
        term: {
          startsWith: `test-${timestamp}`,
        },
      },
    });
  });

  it('should insert a new case row into Prisma Case table on valid input', async () => {
    const testTerm = `test-${Date.now()}-valid-term`;
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ term: testTerm }),
    });

    const res = await POST(req);

    expect(res.status).toBe(201);
    const data = await res.json() as { id: string; term: string };
    expect(data.term).toBe(testTerm);

    // Verify the case was actually inserted in the database
    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(savedCase).toBeDefined();
    expect(savedCase?.term).toBe(testTerm);
  });

  it('should return 400 error for empty input and not insert a row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ term: '' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const errorData = await res.json() as { error?: string };
    expect(errorData.error).toBeDefined();
  });

  it('should return 400 error for whitespace-only input and not insert a row', async () => {
    const req = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ term: '   \t\n   ' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const errorData = await res.json() as { error?: string };
    expect(errorData.error).toBeDefined();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
