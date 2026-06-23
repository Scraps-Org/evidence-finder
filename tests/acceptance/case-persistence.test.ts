import { describe, it, expect, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.case.deleteMany({ where: { identifyingTerms: { startsWith: 'ACCEPTANCE-TEST-' } } })
  await prisma.$disconnect()
})

describe('Case persistence', () => {
  it('writes a Case row with identifyingTerms and reads it back', async () => {
    const terms = `ACCEPTANCE-TEST-${Date.now()}`

    const created = await prisma.case.create({
      data: { identifyingTerms: terms },
    })

    expect(created.id).toBeDefined()
    expect(created.identifyingTerms).toBe(terms)

    const found = await prisma.case.findUnique({ where: { id: created.id } })
    expect(found).not.toBeNull()
    expect(found!.identifyingTerms).toBe(terms)
  })

  it('can query all cases and the written row appears in the list', async () => {
    const terms = `ACCEPTANCE-TEST-${Date.now()}-list`

    await prisma.case.create({ data: { identifyingTerms: terms } })

    const all = await prisma.case.findMany()
    const match = all.find((c) => c.identifyingTerms === terms)
    expect(match).toBeDefined()
  })
})
