import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '../../src/app/api/candidates/[candidateId]/route';

vi.mock('../../src/lib/prisma', () => ({
  default: {
    candidate: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('PATCH /api/candidates/[candidateId] — triage route', () => {
  beforeEach(async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.candidate.update).mockReset();
    vi.mocked(prisma.candidate.findUnique).mockReset();
  });

  it('sets status to evidence when action=confirm', async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.candidate.update).mockResolvedValue({
      id: 'cand-1',
      status: 'evidence',
      url: 'https://example.com',
      title: 'Test',
      caseId: 'case-1',
      createdAt: new Date(),
    } as never);

    const req = new Request('http://test/api/candidates/cand-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'evidence' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ candidateId: 'cand-1' }) });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('evidence');
    expect(vi.mocked(prisma.candidate.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'cand-1' }) as unknown,
        data: expect.objectContaining({ status: 'evidence' }) as unknown,
      }),
    );
  });

  it('sets status to dismissed when action=dismiss', async () => {
    const { default: prisma } = await import('../../src/lib/prisma');
    vi.mocked(prisma.candidate.update).mockResolvedValue({
      id: 'cand-1',
      status: 'dismissed',
      url: 'https://example.com',
      title: 'Test',
      caseId: 'case-1',
      createdAt: new Date(),
    } as never);

    const req = new Request('http://test/api/candidates/cand-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'dismissed' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ candidateId: 'cand-1' }) });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('dismissed');
    expect(vi.mocked(prisma.candidate.update)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'cand-1' }) as unknown,
        data: expect.objectContaining({ status: 'dismissed' }) as unknown,
      }),
    );
  });

  it('returns 400 for an invalid status value', async () => {
    const req = new Request('http://test/api/candidates/cand-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'bogus' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await PATCH(req, { params: Promise.resolve({ candidateId: 'cand-1' }) });
    expect(res.status).toBe(400);
  });
});
