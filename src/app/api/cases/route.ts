import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const { terms } = await req.json();
  if (!terms || terms.trim().length === 0) {
    return NextResponse.json({ error: 'Terms are required' }, { status: 400 });
  }
  const newCase = await prisma.case.create({
    data: { terms: terms.trim() },
  });
  return NextResponse.json(newCase, { status: 201 });
}