import prisma from '~/lib/prisma';
import { BraveSource } from '~/lib/braveSource';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  // Search the case's STORED identifying terms (D7 signal: "a case's terms"),
  // not whatever the request body carries — the caller only supplies the caseId.
  const caseRow = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRow) {
    return Response.json({ error: 'case not found' }, { status: 404 });
  }

  const results = await new BraveSource().search(caseRow.identifyingTerms ?? '');

  const candidates = [];
  for (const r of results) {
    const candidate = await prisma.candidate.upsert({
      where: { url_caseId: { url: r.url, caseId } },
      update: {},
      create: { url: r.url, caseId, status: 'new', title: r.title ?? null },
    });
    candidates.push(candidate);
  }

  return Response.json({ candidates }, { status: 200 });
}
