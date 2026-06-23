import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Evidence Prisma model', () => {
  it('defines all five required fields and caseId as a foreign key referencing Case', async () => {
    const timestamp = Date.now()
    const uniqueEmail = `user-${timestamp}@example.com`

    const kase = await prisma.case.create({
      data: { title: `Test Case ${timestamp}` },
    })

    const evidence = await prisma.evidence.create({
      data: {
        url: `https://example.com/page-${timestamp}`,
        pageTitle: `Page Title ${timestamp}`,
        domain: `example.com`,
        detectedAt: new Date(),
        caseId: kase.id,
      },
    })

    const found = await prisma.evidence.findUnique({ where: { id: evidence.id } })

    expect(found).not.toBeNull()
    expect(found!.url).toBe(`https://example.com/page-${timestamp}`)
    expect(found!.pageTitle).toBe(`Page Title ${timestamp}`)
    expect(found!.domain).toBe('example.com')
    expect(found!.detectedAt).toBeInstanceOf(Date)
    expect(found!.caseId).toBe(kase.id)

    await prisma.evidence.delete({ where: { id: evidence.id } })
    await prisma.case.delete({ where: { id: kase.id } })
  })
})
