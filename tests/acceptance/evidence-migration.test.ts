import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Evidence model – persistence layer', () => {
  const uniqueSuffix = Date.now().toString()

  let caseId: string
  let evidenceId: string

  beforeAll(async () => {
    const created = await prisma.case.create({
      data: { title: `Test Case ${uniqueSuffix}` },
    })
    caseId = created.id
  })

  afterAll(async () => {
    await prisma.evidence.deleteMany({ where: { caseId } })
    await prisma.case.delete({ where: { id: caseId } })
  })

  it('creates an Evidence row with all five required fields and round-trips them correctly', async () => {
    const url = `https://example-${uniqueSuffix}.com/page`
    const pageTitle = `Page Title ${uniqueSuffix}`
    const domain = `example-${uniqueSuffix}.com`
    const detectedAt = new Date()

    const row = await prisma.evidence.create({
      data: {
        url,
        pageTitle,
        domain,
        detectedAt,
        caseId,
      },
    })
    evidenceId = row.id

    const found = await prisma.evidence.findUnique({ where: { id: evidenceId } })

    expect(found).not.toBeNull()
    expect(found!.url).toBe(url)
    expect(found!.pageTitle).toBe(pageTitle)
    expect(found!.domain).toBe(domain)
    expect(found!.caseId).toBe(caseId)
    expect(found!.detectedAt).toBeInstanceOf(Date)
  })

  it('caseId is a foreign key – creating evidence with a non-existent caseId throws', async () => {
    await expect(
      prisma.evidence.create({
        data: {
          url: 'https://orphan.example.com',
          pageTitle: 'Orphan',
          domain: 'orphan.example.com',
          detectedAt: new Date(),
          caseId: 'non-existent-id-000',
        },
      })
    ).rejects.toThrow()
  })
})
