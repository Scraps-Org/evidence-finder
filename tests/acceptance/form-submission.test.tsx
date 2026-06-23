import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrismaClient } from '@prisma/client';
import EvidenceFinder from '../../src/components/EvidenceFinder';

const prisma = new PrismaClient();

describe('Case Creation Form Submission', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('submits the form and creates a case that appears in the list', async () => {
    const user = userEvent.setup();
    const terms = `integration-test-${Date.now()}`;

    render(<EvidenceFinder />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, terms);
    await user.click(submitButton);

    expect(screen.getByText(terms)).toBeInTheDocument();

    const savedCase = await prisma.case.findFirst({
      where: { identifyingTerms: terms },
    });
    expect(savedCase).not.toBeNull();
  });

  it('rejects form submission with empty input', async () => {
    const user = userEvent.setup();

    render(<EvidenceFinder />);

    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });
    await user.click(submitButton);

    const caseCount = await prisma.case.count();
    expect(caseCount).toBe(0);
  });
});
