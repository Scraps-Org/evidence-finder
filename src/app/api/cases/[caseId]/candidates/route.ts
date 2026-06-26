import prisma from '~/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await ctx.params;
  return Response.json(await prisma.candidate.findMany({ where: { caseId } }));
}
