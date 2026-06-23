import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrismaClient } from '@prisma/client';
import CaseList from '../../src/components/CaseList';

const prisma = new PrismaClient();

describe('Case list', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('should display a newly created case with identifyingTerms in the list', async () => {
    const identifyingTerms = `test-case-${Date.now()}`;
    await prisma.case.create({
      data: { identifyingTerms },
    });

    render(<CaseList />);

    await new Promise((r) => setTimeout(r, 100));

    expect(screen.getByText(identifyingTerms)).toBeInTheDocument();
  });
});
