import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifyingTerms } = body;

    if (!identifyingTerms || typeof identifyingTerms !== 'string') {
      return NextResponse.json(
        { error: 'Identifying terms are required' },
        { status: 400 }
      );
    }

    const trimmed = identifyingTerms.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: 'Identifying terms cannot be empty or whitespace only' },
        { status: 400 }
      );
    }

    const caseRecord = await prisma.case.create({
      data: {
        identifyingTerms: trimmed
      }
    });

    return NextResponse.json(caseRecord, { status: 201 });
  } catch (err) {
    console.error('Error creating case:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(cases, { status: 200 });
  } catch (err) {
    console.error('Error fetching cases:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
