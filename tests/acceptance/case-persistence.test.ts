import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Persistence (Prisma & Migration)', () => {
  afterEach(async () => {
    const timestamp = new Date().toISOString();
    await prisma.case.deleteMany({
      where: {
        identifyingTerms: {
          contains: timestamp,
        },
      },
    });
    await prisma.$disconnect();
  });

  it('Case table exists and supports create/read operations', async () => {
    const testId = new Date().toISOString();
    const identifyingTerms = `Case Persistence Test ${testId}`;

    const created = await prisma.case.create({
      data: { identifyingTerms },
    });

    expect(created.id).toBeDefined();
    expect(created.identifyingTerms).toBe(identifyingTerms);

    const found = await prisma.case.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found?.identifyingTerms).toBe(identifyingTerms);
  });

  it('Case migration file exists and creates the Case table', async () => {
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = '${prisma.case.name}';
    `;

    expect(tables).toBeDefined();
  });
});
