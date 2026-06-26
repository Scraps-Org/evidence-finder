import prisma from '~/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ candidateId: string }> }
) {
  const body = await req.json().catch(() => null);
  const status = body?.status;

  if (status !== 'evidence' && status !== 'dismissed') {
    return new Response(
      JSON.stringify({ error: 'invalid status' }),
      { status: 400, headers: { 'content-type': 'application/json' } }
    );
  }

  const { candidateId } = await ctx.params;

  const updated = await prisma.candidate.update({
    where: { id: candidateId },
    data: { status },
  });

  return Response.json(updated);
}
