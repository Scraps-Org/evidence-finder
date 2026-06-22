import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PrismaClient } from '@prisma/client';
import CaseList from '../../src/components/CaseList';

const prisma = new PrismaClient();

describe('Case list UI', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should fetch and display persisted cases from the GET /api/cases endpoint', async () => {
    const terms1 = `list-ui-1-${Date.now()}`;
    const terms2 = `list-ui-2-${Date.now()}`;
    await prisma.case.create({ data: { identifyingTerms: terms1 } });
    await prisma.case.create({ data: { identifyingTerms: terms2 } });

    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(terms1)).toBeDefined();
      expect(screen.getByText(terms2)).toBeDefined();
    }, { timeout: 5000 });
  });

  it('should display newly saved case when created', async () => {
    const terms = `list-ui-new-${Date.now()}`;
    render(<CaseList />);

    await waitFor(() => {
      expect(screen.getByText(/no cases/i)).toBeDefined();
    }, { timeout: 5000 });

    await prisma.case.create({ data: { identifyingTerms: terms } });

    await waitFor(() => {
      expect(screen.getByText(terms)).toBeDefined();
    }, { timeout: 5000 });
  });
});