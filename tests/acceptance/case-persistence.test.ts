import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Prisma Persistence Layer', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Case model is defined in Prisma schema and table exists', async () => {
    // This test verifies the Case table exists by attempting a query.
    // If the table does not exist, Prisma will throw an error.
    const result = await prisma.case.findMany({ take: 1 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('can insert and retrieve a case from the database', async () => {
    const testTerm = `test-case-${Date.now()}`;
    const created = await prisma.case.create({
      data: { searchTerm: testTerm },
    });

    expect(created.id).toBeDefined();
    expect(created.searchTerm).toBe(testTerm);

    const retrieved = await prisma.case.findUnique({
      where: { id: created.id },
    });

    expect(retrieved).not.toBeNull();
    expect(retrieved?.searchTerm).toBe(testTerm);

    await prisma.case.delete({ where: { id: created.id } });
  });
});
