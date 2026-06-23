import { describe, it, expect, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('D2-case-input: Case persistence round-trip', () => {
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

  it('creates a Case row with identifyingTerms and reads it back', async () => {
    const terms = `PersistenceTest-${Date.now()}`
    const created = await prisma.case.create({
      data: { identifyingTerms: terms },
    })
    createdIds.push(created.id)

    expect(created.identifyingTerms).toBe(terms)

    const found = await prisma.case.findUnique({ where: { id: created.id } })
    expect(found).not.toBeNull()
    expect(found!.identifyingTerms).toBe(terms)
  })

  it('lists all cases including newly created ones', async () => {
    const terms = `ListTest-${Date.now()}`
    const created = await prisma.case.create({
      data: { identifyingTerms: terms },
    })
    createdIds.push(created.id)

    const all = await prisma.case.findMany()
    const match = all.find((c) => c.id === created.id)
    expect(match).toBeDefined()
    expect(match!.identifyingTerms).toBe(terms)
  })
})
