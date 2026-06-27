import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.stubGlobal(
  'fetch',
  vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
);

const mockedFetch = vi.mocked(fetch);

import Page from '../../src/app/page';

function makeResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('D10-case-create-ui — home page case creation', () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockedFetch.mockReset();
  });

  it('renders a text input and a submit button labeled 생성 or create', () => {
    render(<Page />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDefined();
    const btn = screen.queryByRole('button', { name: /생성|create/i });
    expect(btn).not.toBeNull();
  });

  it('POSTs to /api/cases with the identifying terms on valid submit', async () => {
    mockedFetch.mockResolvedValueOnce(makeResponse({ id: 'abc123' }));
    render(<Page />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '홍길동 2024' } });
    const btn = screen.getByRole('button', { name: /생성|create/i });
    fireEvent.click(btn);
    await waitFor(() => expect(mockedFetch).toHaveBeenCalledTimes(1));
    const [url, init] = mockedFetch.mock.calls[0]!;
    expect(String(url)).toContain('/api/cases');
    expect((init as RequestInit).method?.toUpperCase()).toBe('POST');
    const sentBody = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
    expect(Object.values(sentBody).join(' ')).toContain('홍길동 2024');
  });

  it('navigates to /cases/<newId> via useRouter().push after successful POST', async () => {
    mockedFetch.mockResolvedValueOnce(makeResponse({ id: 'xyz789' }));
    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '테스트 식별어' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(mockPush).toHaveBeenCalledWith('/cases/xyz789');
  });

  it('does not POST or navigate when input is empty', async () => {
    render(<Page />);
    const btn = screen.getByRole('button', { name: /생성|create/i });
    fireEvent.click(btn);
    await waitFor(() => {});
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not POST or navigate when input is whitespace only', async () => {
    render(<Page />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));
    await waitFor(() => {});
    expect(mockedFetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
