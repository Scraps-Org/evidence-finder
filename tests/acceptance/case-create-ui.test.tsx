import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';

// --- next/navigation mock (must be before page import) ---
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// --- fetch stub ---
const mockFetch = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
vi.stubGlobal('fetch', mockFetch);

import HomePage from '../../src/app/page';

describe('D10-case-create-ui: home page case creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('page.tsx declares "use client" at the top of the file', () => {
    const filePath = path.resolve(__dirname, '../../src/app/page.tsx');
    const source = fs.readFileSync(filePath, 'utf-8');
    // 'use client' must appear before any import or declaration
    const firstNonBlankLine = source
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0);
    expect(firstNonBlankLine).toMatch(/^['"]use client['"]/);
  });

  it('renders a text input and a submit button labeled 생성 or create', () => {
    render(<HomePage />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /생성|create/i });
    expect(btn).toBeInTheDocument();
  });

  it('POSTs identifying terms to /api/cases on valid submit', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'case-abc' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    render(<HomePage />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '홍길동 사기' },
    });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/cases');
    expect(init.method?.toUpperCase()).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(Object.values(body)).toContain('홍길동 사기');
  });

  it('navigates to /cases/<newId> via useRouter().push after successful creation', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'case-xyz' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    render(<HomePage />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '테스트 식별어' },
    });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cases/case-xyz');
    });
  });

  it('does not POST or navigate when input is empty', async () => {
    render(<HomePage />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not POST or navigate when input is whitespace only', async () => {
    render(<HomePage />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
