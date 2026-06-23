import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { POST } from '../../src/app/api/cases/route'

const prisma = new PrismaClient()

const uniqueTag = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}`

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

describe('POST /api/cases', () => {
  beforeEach(() => {})

  it('persists a new Case row with identifyingTerms when valid input is submitted', async () => {
    const terms = `John Doe ${uniqueTag()}`
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: terms }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json() as { id: string; identifyingTerms: string }
    expect(body.identifyingTerms).toBe(terms)
    expect(body.id).toBeTruthy()

    createdIds.push(body.id)

    const row = await prisma.case.findUnique({ where: { id: body.id } })
    expect(row).not.toBeNull()
    expect(row?.identifyingTerms).toBe(terms)
  })

  it('rejects empty string identifyingTerms with a 4xx and writes no row', async () => {
    const countBefore = await prisma.case.count()

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const countAfter = await prisma.case.count()
    expect(countAfter).toBe(countBefore)
  })

  it('rejects whitespace-only identifyingTerms with a 4xx and writes no row', async () => {
    const countBefore = await prisma.case.count()

    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   \t\n  ' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const countAfter = await prisma.case.count()
    expect(countAfter).toBe(countBefore)
  })
})
