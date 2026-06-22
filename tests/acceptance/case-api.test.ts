import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Cases API Route', () => {
  const testId = `test-${Date.now()}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { searchTerm: { contains: testId } },
    });
  });

  describe('D2-case-input: API route inserts case into Postgres via Prisma', () => {
    it('accepts valid identifying terms and inserts into Case table', async () => {
      const searchTerm = `Valid Case ${testId}`;
      const request = new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const data = (await response.json()) as { id: string; searchTerm: string };
      expect(data).toHaveProperty('id');
      expect(data.searchTerm).toBe(searchTerm);

      const savedCase = await prisma.case.findUnique({
        where: { id: data.id },
      });
      expect(savedCase).not.toBeNull();
      expect(savedCase?.searchTerm).toBe(searchTerm);
    });

    it('rejects empty string input and returns error', async () => {
      const request = new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: '' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = (await response.json()) as { error: string };
      expect(data).toHaveProperty('error');

      const count = await prisma.case.count({
        where: { searchTerm: '' },
      });
      expect(count).toBe(0);
    });

    it('rejects whitespace-only input and returns error', async () => {
      const request = new Request('http://localhost:3000/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: '   ' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = (await response.json()) as { error: string };
      expect(data).toHaveProperty('error');

      const count = await prisma.case.count({
        where: { searchTerm: '   ' },
      });
      expect(count).toBe(0);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
