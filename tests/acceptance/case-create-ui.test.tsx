import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page from '../../src/app/page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('D10-case-create-ui: home page case creation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('renders a text input and a submit button labeled 생성 or create', () => {
    render(<Page />);
    expect(screen.getByRole('textbox')).toBeDefined();
    const btn = screen.getByRole('button', { name: /생성|create/i });
    expect(btn).toBeDefined();
  });

  it('POSTs identifying terms to /api/cases when a valid term is submitted', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-42' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '홍길동' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/cases');
    expect(init.method?.toUpperCase()).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(Object.values(body).join('')).toContain('홍길동');
  });

  it('navigates to /cases/<newId> via useRouter().push on successful POST', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-99' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '이순신' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/cases/case-99');
    });
  });

  it('does not POST or navigate when input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not POST or navigate when input is whitespace only', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchMock);

    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
