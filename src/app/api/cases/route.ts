import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

export async function GET() {
  const cases = await prisma.case.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(cases);
}

export async function POST(req: Request) {
  const body = await req.json() as { identifyingTerms?: unknown };
  const terms = typeof body.identifyingTerms === 'string' ? body.identifyingTerms.trim() : null;

  if (!terms) {
    return NextResponse.json(
      { error: 'identifyingTerms must be a non-empty string' },
      { status: 422 }
    );
  }

  const newCase = await prisma.case.create({
    data: { identifyingTerms: terms },
  });

  return NextResponse.json(newCase, { status: 201 });
}
