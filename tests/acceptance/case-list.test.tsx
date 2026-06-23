import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrismaClient } from '@prisma/client';
import CaseList from '../../src/components/CaseList';

const prisma = new PrismaClient();

describe('Case List Component', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('displays a saved case with identifying terms in the list', async () => {
    const terms = `test-case-${Date.now()}`;
    await prisma.case.create({
      data: { identifyingTerms: terms },
    });

    const component = await CaseList();
    render(component);

    expect(screen.getByText(terms)).toBeInTheDocument();
  });

  it('displays multiple cases in the list', async () => {
    const terms1 = `case-one-${Date.now()}`;
    const terms2 = `case-two-${Date.now()}`;

    await prisma.case.create({ data: { identifyingTerms: terms1 } });
    await prisma.case.create({ data: { identifyingTerms: terms2 } });

    const component = await CaseList();
    render(component);

    expect(screen.getByText(terms1)).toBeInTheDocument();
    expect(screen.getByText(terms2)).toBeInTheDocument();
  });
});
