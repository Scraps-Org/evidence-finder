import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Page from '../../src/app/page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('D10-case-create-ui: home page case creation', () => {
  beforeEach(() => {
    mockPush.mockReset();
    vi.stubGlobal('fetch', vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>());
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

  it('POSTs identifying terms to /api/cases on valid submission', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-abc' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '홍길동' } });
    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    fireEvent.click(btn);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/cases');
    expect((init as RequestInit).method?.toUpperCase()).toBe('POST');
    const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
    expect(Object.values(body).join('')).toContain('홍길동');
  });

  it('navigates to /cases/<newId> via useRouter().push on success', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-xyz' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '김철수' } });
    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    fireEvent.click(btn);

    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(mockPush.mock.calls[0]![0]).toBe('/cases/case-xyz');
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

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    const btn = screen.queryByRole('button', { name: /생성/i })
      ?? screen.getByRole('button', { name: /create/i });
    fireEvent.click(btn);

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
