import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { terms } = await req.json();
  if (!terms || terms.trim().length === 0) {
    return NextResponse.json({ error: 'Terms required' }, { status: 400 });
  }
  const caseItem = await prisma.case.create({ data: { terms } });
  return NextResponse.json(caseItem, { status: 201 });
}

export async function GET() {
  const cases = await prisma.case.findMany();
  return NextResponse.json(cases);
}