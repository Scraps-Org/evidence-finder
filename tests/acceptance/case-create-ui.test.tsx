/**
 * Acceptance test: D10-case-create-ui
 * Home page (/) — client component with identifying-terms input + submit button.
 * Covers all four frozen judgment criteria.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock next/navigation so useRouter is available in JSDOM.
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// We import the page default after mocking navigation.
import HomePage from '../../src/app/page';

describe('D10-case-create-ui: home page case creation', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Criterion 1: page is a client component with text input and submit button labeled "생성" or "create"
  it('renders a text input and a submit button labeled 생성 or create', () => {
    render(<HomePage />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDefined();

    // Accept either Korean "생성" or English "create" (case-insensitive)
    const button =
      screen.queryByRole('button', { name: '생성' }) ??
      screen.getByRole('button', { name: /create/i });
    expect(button).toBeDefined();
  });

  // Criterion 2: valid input → POST to /api/cases with the identifying terms payload
  it('POSTs identifying terms to /api/cases when a valid term is submitted', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-abc' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<HomePage />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '홍길동');

    const button =
      screen.queryByRole('button', { name: '생성' }) ??
      screen.getByRole('button', { name: /create/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain('/api/cases');
    expect(init?.method?.toUpperCase()).toBe('POST');
    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    // The payload must contain the identifying term somewhere
    const payloadValues = Object.values(body).join(' ');
    expect(payloadValues).toContain('홍길동');
  });

  // Criterion 3: on successful POST, navigates to /cases/<newId> via useRouter().push
  it('navigates to /cases/<newId> via router.push on success', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'case-xyz' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<HomePage />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '김철수');

    const button =
      screen.queryByRole('button', { name: '생성' }) ??
      screen.getByRole('button', { name: /create/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/cases/case-xyz');
    });
  });

  // Criterion 4: empty or whitespace-only input does not POST and does not navigate
  it('does not POST or navigate when input is empty', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchMock);

    render(<HomePage />);

    const button =
      screen.queryByRole('button', { name: '생성' }) ??
      screen.getByRole('button', { name: /create/i });
    fireEvent.click(button);

    // Allow any microtasks to flush
    await new Promise((r) => setTimeout(r, 50));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('does not POST or navigate when input contains only whitespace', async () => {
    const fetchMock = vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>();
    vi.stubGlobal('fetch', fetchMock);

    render(<HomePage />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '   ');

    const button =
      screen.queryByRole('button', { name: '생성' }) ??
      screen.getByRole('button', { name: /create/i });
    fireEvent.click(button);

    await new Promise((r) => setTimeout(r, 50));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
