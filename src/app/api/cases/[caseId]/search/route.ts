import prisma from '~/lib/prisma';
import { BraveSource } from '~/lib/braveSource';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const { terms } = await req.json();

  const results = await new BraveSource().search(terms);

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
