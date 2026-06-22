import { prisma } from '~/lib/db';

export async function POST(req: Request) {
  const { terms } = await req.json();

  if (!terms || terms.trim() === '') {
    return Response.json({ error: 'terms required' }, { status: 400 });
  }

  const created = await prisma.case.create({
    data: { terms },
  });

  return Response.json(created, { status: 201 });
}
