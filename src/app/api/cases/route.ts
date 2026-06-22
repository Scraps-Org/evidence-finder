import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const { terms } = await req.json();
  if (!terms || !terms.trim()) {
    return NextResponse.json({ error: 'Terms are required' }, { status: 400 });
  }
  const caseItem = await prisma.case.create({
    data: { terms: terms.trim() },
  });
  return NextResponse.json(caseItem, { status: 201 });
}

export async function GET() {
  const cases = await prisma.case.findMany();
  return NextResponse.json(cases);
}