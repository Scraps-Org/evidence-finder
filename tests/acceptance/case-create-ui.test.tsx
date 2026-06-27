import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockPush.mockReset();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

async function importHome() {
  const mod = await import('../../src/app/page');
  return mod.default;
}

describe('D10-case-create-ui: home page case creation', () => {
  it('page.tsx declares use client at the top of the file', () => {
    const filePath = path.resolve(__dirname, '../../src/app/page.tsx');
    const source = fs.readFileSync(filePath, 'utf8');
    const firstMeaningfulLine = source
      .split('\n')
      .find((l) => l.trim().length > 0) ?? '';
    expect(firstMeaningfulLine.trim()).toBe("'use client';");
  });

  it('renders an identifying-terms text input and a submit button labeled 생성 or create', async () => {
    const Home = await importHome();
    render(<Home />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /생성|create/i });
    expect(btn).toBeInTheDocument();
  });

  it('submitting a valid term POSTs to /api/cases with the term payload', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'abc123' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Home = await importHome();
    render(<Home />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '홍길동' },
    });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/cases');
    expect(init.method?.toUpperCase()).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(Object.values(body)).toContain('홍길동');
  });

  it('navigates to /cases/<newId> via router.push on successful POST', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'newCase42' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const Home = await importHome();
    render(<Home />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '테스트케이스' },
    });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cases/newCase42');
    });
  });

  it('does not POST or navigate when input is empty', async () => {
    const Home = await importHome();
    render(<Home />);

    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not POST or navigate when input is whitespace only', async () => {
    const Home = await importHome();
    render(<Home />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
