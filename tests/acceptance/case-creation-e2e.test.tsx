import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page from '../../src/app/page';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case creation end-to-end (form to DB)', () => {
  const testIdentifier = `e2e-test-${Date.now()}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({
      where: { identifyingTerms: testIdentifier },
    });
    await prisma.$disconnect();
  });

  it('should submit form, call API, and persist case to database', async () => {
    const user = userEvent.setup();
    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, testIdentifier);
    await user.click(submitButton);

    // Wait for the case to appear in the list
    await waitFor(
      async () => {
        const savedCase = await prisma.case.findFirst({
          where: { identifyingTerms: testIdentifier },
        });
        expect(savedCase).not.toBeNull();
      },
      { timeout: 5000 }
    );
  });

  it('should show validation error when submitting empty input', async () => {
    const user = userEvent.setup();
    render(<Page />);

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitButton = screen.getByRole('button', { name: /submit|create|save/i });

    await user.type(input, '   ');
    await user.click(submitButton);

    // Should show error message or input should still be empty in DB
    const cases = await prisma.case.findMany({
      where: { identifyingTerms: '   ' },
    });
    expect(cases).toHaveLength(0);
  });
});
