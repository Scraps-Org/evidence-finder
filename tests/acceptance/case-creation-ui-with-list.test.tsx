import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '../../src/app/page';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const testId = `ui-case-${Date.now()}`;

describe('Case Creation & List [HIGH-IMPACT]', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
    await prisma.$disconnect();
  });

  it('submits identifying terms via form and displays the new case in the list', async () => {
    const user = userEvent.setup();
    render(await Page());

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitBtn = screen.getByRole('button', { name: /create case/i });

    await user.type(input, `${testId}-terms`);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(`${testId}-terms`)).toBeInTheDocument();
    });
  });

  it('rejects empty identifyingTerms and shows no row in the list', async () => {
    const user = userEvent.setup();
    render(await Page());

    const submitBtn = screen.getByRole('button', { name: /create case/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|whitespace/i)).toBeInTheDocument();
    });

    const dbCount = await prisma.case.count();
    expect(dbCount).toBe(0);
  });

  it('rejects whitespace-only identifyingTerms and shows no row', async () => {
    const user = userEvent.setup();
    render(await Page());

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitBtn = screen.getByRole('button', { name: /create case/i });

    await user.type(input, '   ');
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/required|cannot be empty|whitespace/i)).toBeInTheDocument();
    });

    const dbCount = await prisma.case.count();
    expect(dbCount).toBe(0);
  });

  it('displays multiple cases in the list after creating them', async () => {
    const user = userEvent.setup();
    render(await Page());

    const input = screen.getByRole('textbox', { name: /identifying terms/i });
    const submitBtn = screen.getByRole('button', { name: /create case/i });

    await user.type(input, `${testId}-case-1`);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(`${testId}-case-1`)).toBeInTheDocument();
    });

    await user.clear(input);
    await user.type(input, `${testId}-case-2`);
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(`${testId}-case-2`)).toBeInTheDocument();
    });

    expect(screen.getByText(`${testId}-case-1`)).toBeInTheDocument();
    expect(screen.getByText(`${testId}-case-2`)).toBeInTheDocument();
  });
}
