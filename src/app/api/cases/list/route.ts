import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET(): Promise<NextResponse> {
  const cases = await prisma.case.findMany({ orderBy: { id: 'desc' } });
  return NextResponse.json(cases);
}
