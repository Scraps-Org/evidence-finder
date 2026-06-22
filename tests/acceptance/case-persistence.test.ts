import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case Persistence & Migration', () => {
  const testId = `persist-test-${Date.now()}-${Math.random()}`;

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { searchTerm: { contains: testId } },
    });
    await prisma.$disconnect();
  });

  it('Case table exists and can store and retrieve case data via Prisma', async () => {
    const searchTerm = `Persistence Test ${testId}`;

    const created = await prisma.case.create({
      data: { searchTerm },
    });
    expect(created.id).toBeDefined();
    expect(created.searchTerm).toBe(searchTerm);

    const retrieved = await prisma.case.findUnique({
      where: { id: created.id },
    });
    expect(retrieved).not.toBeNull();
    expect(retrieved!.searchTerm).toBe(searchTerm);
  });
});
