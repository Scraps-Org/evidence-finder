import { describe, it, expect, afterEach, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { POST } from '../../src/app/api/cases/route'

const prisma = new PrismaClient()

afterEach(async () => {
  await prisma.case.deleteMany({})
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('POST /api/cases', () => {
  it('writes identifyingTerms to the Case table in Postgres', async () => {
    const terms = `test-subject-${Date.now()}`
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: terms }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const row = await prisma.case.findFirst({ where: { identifyingTerms: terms } })
    expect(row).not.toBeNull()
    expect(row!.identifyingTerms).toBe(terms)
  })

  it('rejects empty identifyingTerms with 4xx and writes no row', async () => {
    const countBefore = await prisma.case.count()
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    })

    const res = await POST(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const countAfter = await prisma.case.count()
    expect(countAfter).toBe(countBefore)
  })

  it('rejects whitespace-only identifyingTerms with 4xx and writes no row', async () => {
    const countBefore = await prisma.case.count()
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    })

    const res = await POST(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const countAfter = await prisma.case.count()
    expect(countAfter).toBe(countBefore)
  })
})
