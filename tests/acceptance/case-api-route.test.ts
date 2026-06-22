import { describe, it, expect, afterEach } from 'vitest';
import { POST } from '../../src/app/api/cases/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('케이스 API 라우트', () => {
  afterEach(async () => {
    await prisma.case.deleteMany({
      where: {
        identifyingTerms: {
          startsWith: 'test-',
        },
      },
    });
  });

  it('유효한 식별 검색어를 받으면 Prisma를 통해 Case 테이블에 행을 삽입한다', async () => {
    const identifyingTerms = `test-case-${Date.now()}`;
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = await response.json() as { id: string; identifyingTerms: string };
    expect(data.id).toBeDefined();
    expect(data.identifyingTerms).toBe(identifyingTerms);

    const savedCase = await prisma.case.findUnique({
      where: { id: data.id },
    });
    expect(savedCase).toBeDefined();
    expect(savedCase!.identifyingTerms).toBe(identifyingTerms);
  });

  it('빈 식별 검색어를 받으면 400 오류를 반환하고 DB에 행을 삽입하지 않는다', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json() as { error: string };
    expect(data.error).toBeDefined();
  });

  it('공백만으로 구성된 식별 검색어를 받으면 400 오류를 반환하고 DB에 행을 삽입하지 않는다', async () => {
    const request = new Request('http://localhost:3000/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json() as { error: string };
    expect(data.error).toBeDefined();

    const caseCount = await prisma.case.count({
      where: {
        identifyingTerms: '   ',
      },
    });
    expect(caseCount).toBe(0);
  });
});
