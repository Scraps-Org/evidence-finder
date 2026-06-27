import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Page from '../../src/app/page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('D10-case-create-ui — home page case creation', () => {
  beforeEach(() => {
    mockPush.mockClear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a text input and a submit button labeled 생성 or create', () => {
    render(<Page />);
    expect(screen.getByRole('textbox')).toBeDefined();
    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    expect(btn).toBeDefined();
  });

  it('POSTs to /api/cases with the identifying terms on valid submit', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'case-42' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '홍길동 사기' },
    });

    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    fireEvent.click(btn);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/cases');
    expect((opts as RequestInit).method?.toUpperCase()).toBe('POST');
    const body = JSON.parse((opts as RequestInit).body as string) as Record<string, unknown>;
    expect(Object.values(body).some((v) => String(v).includes('홍길동 사기'))).toBe(true);
  });

  it('navigates to /cases/<newId> via router.push on success — not window.location', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: 'case-99' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '테스트 식별어' },
    });

    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    fireEvent.click(btn);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/cases/case-99'));
  });

  it('does not POST or navigate when input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);

    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    fireEvent.click(btn);

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not POST or navigate when input is whitespace only', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '   ' },
    });

    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    fireEvent.click(btn);

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
