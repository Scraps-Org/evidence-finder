import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Evidence model — schema/migration', () => {
  it('defines all five required fields and the caseId foreign key by round-tripping a real row', async () => {
    // First create a Case to satisfy the foreign key
    const unique = `test-${Date.now()}`
    const caseRow = await prisma.case.create({
      data: { title: `Case for evidence migration test ${unique}` },
    })

    const now = new Date()
    const evidence = await prisma.evidence.create({
      data: {
        url: `https://example.com/${unique}`,
        detectedAt: now,
        pageTitle: `Page ${unique}`,
        domain: 'example.com',
        caseId: caseRow.id,
      },
    })

    try {
      // All five fields must round-trip through the real DB
      expect(evidence.url).toBe(`https://example.com/${unique}`)
      expect(evidence.detectedAt.toISOString()).toBe(now.toISOString())
      expect(evidence.pageTitle).toBe(`Page ${unique}`)
      expect(evidence.domain).toBe('example.com')
      expect(evidence.caseId).toBe(caseRow.id)

      // Confirm the foreign key: reading back via the relation finds the row
      const found = await prisma.evidence.findFirst({
        where: { id: evidence.id },
        include: { case: true },
      })
      expect(found).not.toBeNull()
      expect(found!.case.id).toBe(caseRow.id)
    } finally {
      await prisma.evidence.delete({ where: { id: evidence.id } })
      await prisma.case.delete({ where: { id: caseRow.id } })
    }
  })
})
