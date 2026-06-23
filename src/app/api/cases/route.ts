import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { identifyingTerms } = body as { identifyingTerms?: string };

  if (!identifyingTerms || identifyingTerms.trim() === '') {
    return NextResponse.json(
      { error: 'identifyingTerms must not be empty or whitespace-only' },
      { status: 422 }
    );
  }

  const newCase = await prisma.case.create({
    data: { identifyingTerms: identifyingTerms.trim() },
  });

  return NextResponse.json(newCase, { status: 201 });
}
