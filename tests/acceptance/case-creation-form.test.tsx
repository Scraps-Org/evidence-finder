import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrismaClient } from '@prisma/client';
import CaseCreationForm from '../../src/components/CaseCreationForm';

const prisma = new PrismaClient();

describe('Case creation form', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('should submit identifying terms and save a case to the database', async () => {
    const user = userEvent.setup();
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const identifyingTerms = `test-case-${Date.now()}`;

    await user.type(input, identifyingTerms);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await new Promise((r) => setTimeout(r, 100));

    const savedCase = await prisma.case.findFirst({
      where: { identifyingTerms },
    });
    expect(savedCase).not.toBeNull();
    expect(savedCase?.identifyingTerms).toBe(identifyingTerms);
  });

  it('should reject empty input and show an error', async () => {
    const user = userEvent.setup();
    render(<CaseCreationForm />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await new Promise((r) => setTimeout(r, 100));

    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });

  it('should reject whitespace-only input and show an error', async () => {
    const user = userEvent.setup();
    render(<CaseCreationForm />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    await user.type(input, '   ');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await new Promise((r) => setTimeout(r, 100));

    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});
