import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const makeRequest = (body: Record<string, unknown>) =>
  new Request('http://localhost/api/cases', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/cases', () => {
  const createdIds: string[] = []

  afterEach(async () => {
    if (createdIds.length > 0) {
      await prisma.case.deleteMany({ where: { id: { in: createdIds } } })
      createdIds.length = 0
    }
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('persists a new Case row with identifyingTerms when valid input is submitted', async () => {
    const { POST } = await import('../../src/app/api/cases/route')
    const terms = `test-user-${Date.now()}`
    const res = await POST(makeRequest({ identifyingTerms: terms }))
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; identifyingTerms: string }
    expect(body.identifyingTerms).toBe(terms)
    createdIds.push(body.id)
    const row = await prisma.case.findUnique({ where: { id: body.id } })
    expect(row).not.toBeNull()
    expect(row!.identifyingTerms).toBe(terms)
  })

  it('rejects empty identifyingTerms with 4xx and writes no row', async () => {
    const { POST } = await import('../../src/app/api/cases/route')
    const before = await prisma.case.count()
    const res = await POST(makeRequest({ identifyingTerms: '' }))
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
    const after = await prisma.case.count()
    expect(after).toBe(before)
  })

  it('rejects whitespace-only identifyingTerms with 4xx and writes no row', async () => {
    const { POST } = await import('../../src/app/api/cases/route')
    const before = await prisma.case.count()
    const res = await POST(makeRequest({ identifyingTerms: '   ' }))
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)
    const after = await prisma.case.count()
    expect(after).toBe(before)
  })
})
