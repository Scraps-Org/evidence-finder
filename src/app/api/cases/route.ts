import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const { identifyingTerms } = body;
    
    if (!identifyingTerms || typeof identifyingTerms !== 'string' || !identifyingTerms.trim()) {
      return NextResponse.json(
        { error: 'identifyingTerms is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    const newCase = await prisma.case.create({
      data: {
        identifyingTerms: identifyingTerms.trim()
      }
    });
    
    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
