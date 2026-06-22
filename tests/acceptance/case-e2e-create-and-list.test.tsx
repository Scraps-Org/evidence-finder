import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import CaseForm from '../../src/components/CaseForm';
import CaseList from '../../src/components/CaseList';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Case Creation E2E - Form Submit → API → List', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.case.deleteMany({});
  });

  it('submitting form persists case and appears in list', async () => {
    const uniqueId = `e2e-test-${Date.now()}`;
    let refreshKey = 0;
    const { rerender } = render(
      <>
        <CaseForm onSuccess={() => { refreshKey++; }} />
        <CaseList refreshTrigger={refreshKey} />
      </>
    );

    const input = screen.getByLabelText(/identifying terms/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /submit|create/i });

    fireEvent.change(input, { target: { value: uniqueId } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(uniqueId)).toBeInTheDocument();
    }, { timeout: 3000 });

    const saved = await prisma.case.findUnique({ where: { identifyingTerms: uniqueId } });
    expect(saved).not.toBeNull();
    expect(saved!.identifyingTerms).toBe(uniqueId);
  });

  it('rejecting empty input does not persist', async () => {
    const beforeCount = await prisma.case.count();
    
    render(<CaseForm />);

    const submitButton = screen.getByRole('button', { name: /submit|create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();
    });

    const afterCount = await prisma.case.count();
    expect(afterCount).toBe(beforeCount);
  });
});
