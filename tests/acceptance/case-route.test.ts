import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { POST as createCase } from '../../src/app/api/cases/route'
import { GET as listCases } from '../../src/app/api/cases/route'

const prisma = new PrismaClient()

const uniqueTerm = () => `test-term-${Date.now()}-${Math.random().toString(36).slice(2)}`

describe('POST /api/cases — persist identifying terms', () => {
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

  it('inserts a row with identifyingTerms when given a valid non-empty value', async () => {
    const term = uniqueTerm()
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: term }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await createCase(req)
    expect(res.status).toBe(201)

    const body = await res.json() as { id: string; identifyingTerms: string }
    expect(body.identifyingTerms).toBe(term)
    createdIds.push(body.id)

    const row = await prisma.case.findUnique({ where: { id: body.id } })
    expect(row).not.toBeNull()
    expect(row!.identifyingTerms).toBe(term)
  })

  it('rejects an empty identifyingTerms with 4xx and creates no row', async () => {
    const countBefore = await prisma.case.count()
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await createCase(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const countAfter = await prisma.case.count()
    expect(countAfter).toBe(countBefore)
  })

  it('rejects a whitespace-only identifyingTerms with 4xx and creates no row', async () => {
    const countBefore = await prisma.case.count()
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ identifyingTerms: '   ' }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await createCase(req)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(res.status).toBeLessThan(500)

    const countAfter = await prisma.case.count()
    expect(countAfter).toBe(countBefore)
  })
})

describe('GET /api/cases — list persisted cases', () => {
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

  it('returns saved cases in the response', async () => {
    const term = uniqueTerm()
    const created = await prisma.case.create({ data: { identifyingTerms: term } })
    createdIds.push(created.id)

    const req = new Request('http://localhost/api/cases', { method: 'GET' })
    const res = await listCases(req)
    expect(res.status).toBe(200)

    const body = await res.json() as { id: string; identifyingTerms: string }[]
    const found = body.find((c) => c.id === created.id)
    expect(found).toBeDefined()
    expect(found!.identifyingTerms).toBe(term)
  })
})
