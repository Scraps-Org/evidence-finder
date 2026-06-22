import { NextResponse } from 'next/server';
import { prisma } from '~/lib/prisma';

export async function POST(request: Request) {
  const body = await request.json();
  
  const { identifyingTerms } = body;
  
  if (!identifyingTerms || typeof identifyingTerms !== 'string' || identifyingTerms.trim() === '') {
    return NextResponse.json(
      { error: 'identifyingTerms is required and must be a non-empty string' },
      { status: 400 }
    );
  }
  
  const created = await prisma.case.create({
    data: { identifyingTerms }
  });
  
  return NextResponse.json(created, { status: 201 });
}
