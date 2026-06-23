import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json()) as { identifyingTerms?: unknown };
  const terms = typeof body.identifyingTerms === 'string' ? body.identifyingTerms : '';

  if (terms.trim() === '') {
    return NextResponse.json({ error: 'identifyingTerms is required' }, { status: 400 });
  }

  const created = await prisma.case.create({
    data: { identifyingTerms: terms },
  });

  return NextResponse.json(created);
}
