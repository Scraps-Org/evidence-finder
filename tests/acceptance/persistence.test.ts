import { afterAll, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Evidence persistence (acceptance)', () => {
  it('persists and reads back a Evidence row via the real database', async () => {
    const unique = `acc-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
    const caseIdParent = await prisma.case.create({ data: {} })
    const created = await prisma.evidence.create({
      data: {
        url: unique,
        pageTitle: 'sample',
        domain: 'sample',
        detectedAt: new Date(),
        caseId: caseIdParent.id,
      },
    })
    expect(created).toBeTruthy()

    const found = await prisma.evidence.findFirst({
      where: { url: unique },
    })
    expect(found).not.toBeNull()
    expect(found?.url).toBe(unique)

    await prisma.evidence.deleteMany({ where: { url: unique } })
    await prisma.case.delete({ where: { id: caseIdParent.id } })
  })
})
