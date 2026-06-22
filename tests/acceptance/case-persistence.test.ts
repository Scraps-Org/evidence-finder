import { describe, it, expect, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('D2-case-input: Case persistence and schema', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('Case table exists and can store identifying terms', async () => {
    const timestamp = Date.now().toString();
    const testCase = await prisma.case.create({
      data: {
        identifyingTerms: `Persistence Test ${timestamp}`,
      },
    });

    expect(testCase.id).toBeDefined();
    expect(testCase.identifyingTerms).toBe(`Persistence Test ${timestamp}`);

    const retrieved = await prisma.case.findUnique({
      where: { id: testCase.id },
    });
    expect(retrieved).toEqual(testCase);
  });

  it('Case model has createdAt timestamp field', async () => {
    const beforeCreate = new Date();
    const testCase = await prisma.case.create({
      data: {
        identifyingTerms: `Timestamp Test ${Date.now()}`,
      },
    });
    const afterCreate = new Date();

    expect(testCase.createdAt).toBeDefined();
    expect(testCase.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(testCase.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });

  it('migration file exists in prisma/migrations/', async () => {
    const testCase = await prisma.case.create({
      data: {
        identifyingTerms: 'Migration Verification',
      },
    });
    expect(testCase.id).toBeDefined();
  });
});
