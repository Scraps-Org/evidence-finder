import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Evidence persistence — schema round-trip', () => {
  const tag = `test-${Date.now()}`
  let caseId: string

  beforeAll(async () => {
    const c = await prisma.case.create({ data: { title: `Case ${tag}` } })
    caseId = c.id
  })

  afterAll(async () => {
    await prisma.evidence.deleteMany({ where: { caseId } })
    await prisma.case.delete({ where: { id: caseId } })
  })

  it('creates an Evidence row with all five required fields and foreign-key relation to Case', async () => {
    const detectedAt = new Date()
    const row = await prisma.evidence.create({
      data: {
        url: `https://example.com/${tag}`,
        pageTitle: `Page ${tag}`,
        domain: 'example.com',
        detectedAt,
        caseId,
      },
    })

    const found = await prisma.evidence.findUnique({ where: { id: row.id } })

    expect(found).not.toBeNull()
    expect(found!.url).toBe(`https://example.com/${tag}`)
    expect(found!.pageTitle).toBe(`Page ${tag}`)
    expect(found!.domain).toBe('example.com')
    expect(found!.detectedAt.getTime()).toBe(detectedAt.getTime())
    expect(found!.caseId).toBe(caseId)
  })

  it('rejects an Evidence row that references a non-existent caseId (FK constraint)', async () => {
    await expect(
      prisma.evidence.create({
        data: {
          url: `https://example.com/fk-${tag}`,
          pageTitle: 'FK Test',
          domain: 'example.com',
          detectedAt: new Date(),
          caseId: 'non-existent-id-00000000',
        },
      }),
    ).rejects.toThrow()
  })
})
