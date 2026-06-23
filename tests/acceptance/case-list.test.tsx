import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Page from '../../src/app/page';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

vi.stubGlobal('fetch', vi.fn());

describe('Case list display [D2-case-input]', () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await prisma.case.deleteMany({});
  });

  it('should display a newly created case in the list after successful save', async () => {
    const identifyingTerms = `DisplayTest_${Date.now()}`;
    const mockCase = { id: '1', identifyingTerms, createdAt: new Date().toISOString() };

    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify([mockCase]), { status: 200 }));

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText(identifyingTerms)).toBeInTheDocument();
    });
  });

  it('should display multiple cases in the list', async () => {
    const case1 = `Case1_${Date.now()}`;
    const case2 = `Case2_${Date.now()}`;
    const mockCases = [
      { id: '1', identifyingTerms: case1, createdAt: new Date().toISOString() },
      { id: '2', identifyingTerms: case2, createdAt: new Date().toISOString() },
    ];

    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify(mockCases), { status: 200 }));

    render(<Page />);

    await waitFor(() => {
      expect(screen.getByText(case1)).toBeInTheDocument();
      expect(screen.getByText(case2)).toBeInTheDocument();
    });
  });
});
