import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { POST } from '../../src/app/api/cases/route'

const prisma = new PrismaClient()

describe('D2-case-input: case-creation API route', () => {
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

  it('persists a new Case row with identifyingTerms when valid input is POSTed', async () => {
    const terms = `RouteTest-${Date.now()}`
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: terms }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = (await res.json()) as { id: string; identifyingTerms: string }
    expect(body.identifyingTerms).toBe(terms)
    createdIds.push(body.id)

    const row = await prisma.case.findUnique({ where: { id: body.id } })
    expect(row).not.toBeNull()
    expect(row!.identifyingTerms).toBe(terms)
  })

  it('returns 4xx and writes no row when identifyingTerms is empty string', async () => {
    const before = await prisma.case.count()
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '' }),
    })

    const res = await POST(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const after = await prisma.case.count()
    expect(after).toBe(before)
  })

  it('returns 4xx and writes no row when identifyingTerms is whitespace-only', async () => {
    const before = await prisma.case.count()
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: '   ' }),
    })

    const res = await POST(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const after = await prisma.case.count()
    expect(after).toBe(before)
  })
})
