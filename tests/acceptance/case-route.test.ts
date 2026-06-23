import { PrismaClient } from '@prisma/client'
import { POST, GET } from '../../src/app/api/cases/route'

const prisma = new PrismaClient()

beforeEach(async () => {
  await prisma.case.deleteMany()
})

afterAll(async () => {
  await prisma.case.deleteMany()
  await prisma.$disconnect()
})

describe('POST /api/cases', () => {
  it('persists a new Case row with identifyingTerms', async () => {
    const term = `test-term-${Date.now()}`
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ identifyingTerms: term }),
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const row = await prisma.case.findFirst({ where: { identifyingTerms: term } })
    expect(row).not.toBeNull()
    expect(row!.identifyingTerms).toBe(term)
  })

  it('rejects an empty string with 4xx and creates no row', async () => {
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

  it('rejects a whitespace-only string with 4xx and creates no row', async () => {
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

describe('GET /api/cases', () => {
  it('returns persisted cases in the response', async () => {
    const term = `list-term-${Date.now()}`
    await prisma.case.create({ data: { identifyingTerms: term } })

    const req = new Request('http://localhost/api/cases', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = await res.json() as { cases: { identifyingTerms: string }[] }
    const found = body.cases.some((c) => c.identifyingTerms === term)
    expect(found).toBe(true)
  })
})
