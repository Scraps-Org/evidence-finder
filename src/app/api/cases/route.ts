import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { identifyingTerms?: string };
    const { identifyingTerms } = body;

    if (!identifyingTerms || identifyingTerms.trim() === '') {
      return NextResponse.json(
        { error: 'Identifying terms cannot be empty' },
        { status: 400 }
      );
    }

    const caseRecord = await prisma.case.create({
      data: {
        identifyingTerms: identifyingTerms.trim(),
      },
    });

    return NextResponse.json(caseRecord, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
