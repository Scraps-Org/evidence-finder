import prisma from '~/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const identifyingTerms = (body as { identifyingTerms?: unknown } | null)
    ?.identifyingTerms;

  if (
    typeof identifyingTerms !== 'string' ||
    identifyingTerms.trim() === ''
  ) {
    return new Response(
      JSON.stringify({ error: 'identifyingTerms required' }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    );
  }

  const created = await prisma.case.create({ data: { identifyingTerms } });

  return new Response(JSON.stringify(created), {
    status: 201,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET(_req: Request) {
  const cases = await prisma.case.findMany({ orderBy: { createdAt: 'desc' } });

  return new Response(JSON.stringify({ cases }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
