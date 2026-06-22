import { describe, it, expect, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('케이스 영속성 및 마이그레이션', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Prisma 스키마에 Case 모델이 정의되어 있다', () => {
    expect(prisma.case).toBeDefined();
  });

  it('Case 테이블이 DB에 존재하고 식별 검색어를 저장할 수 있다', async () => {
    const uniqueId = `migration-test-${Date.now()}-${Math.random()}`;
    
    const createdCase = await prisma.case.create({
      data: {
        identifyingTerms: uniqueId,
      },
    });

    expect(createdCase.id).toBeDefined();
    expect(createdCase.identifyingTerms).toBe(uniqueId);
    expect(createdCase.createdAt).toBeDefined();

    const foundCase = await prisma.case.findUnique({
      where: { id: createdCase.id },
    });

    expect(foundCase).toEqual(createdCase);

    await prisma.case.delete({
      where: { id: createdCase.id },
    });
  });
});
