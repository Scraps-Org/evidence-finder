import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PrismaClient } from '@prisma/client';
import CaseForm from '../../src/components/CaseForm';

const prisma = new PrismaClient();

describe('Case creation form UI', () => {
  beforeEach(async () => {
    await prisma.case.deleteMany({});
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should render the form and accept input', () => {
    render(<CaseForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    expect(input).toBeDefined();
  });

  it('should submit identifyingTerms and persist to database via API', async () => {
    render(<CaseForm />);
    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: /submit|save|create/i });

    const terms = `ui-test-${Date.now()}`;
    fireEvent.change(input, { target: { value: terms } });
    fireEvent.click(submitBtn);

    await waitFor(async () => {
      const saved = await prisma.case.findFirst({
        where: { identifyingTerms: terms },
      });
      expect(saved).not.toBeNull();
      expect(saved?.identifyingTerms).toBe(terms);
    }, { timeout: 5000 });
  });

  it('should show error on empty input submission', async () => {
    render(<CaseForm />);
    const submitBtn = screen.getByRole('button', { name: /submit|save|create/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/required|empty|cannot be blank/i)).toBeDefined();
    }, { timeout: 5000 });

    const count = await prisma.case.count();
    expect(count).toBe(0);
  });
});