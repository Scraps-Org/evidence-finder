import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Candidate persistence (acceptance)', () => {
  it('persists and reads back a Candidate row via the real database', async () => {
    const unique = `acc-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    const parentCase = await prisma.case.create({ data: {} });
    const created = await prisma.candidate.create({
      data: {
        url: unique,
        caseId: parentCase.id,
        status: 'sample',
      },
    });
    expect(created).toBeTruthy();

    const found = await prisma.candidate.findFirst({ where: { url: unique } });
    expect(found).not.toBeNull();
    expect(found?.url).toBe(unique);

    await prisma.candidate.deleteMany({ where: { url: unique } });
    await prisma.case.delete({ where: { id: parentCase.id } });
  });
});
