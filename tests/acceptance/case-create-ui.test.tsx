import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.stubGlobal(
  'fetch',
  vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>()
);

const fetchMock = fetch as ReturnType<typeof vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>>;

async function renderPage() {
  const { default: Page } = await import('../../src/app/page');
  return render(<Page />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('D10-case-create-ui', () => {
  it('home page file declares use client at the top', () => {
    const filePath = path.resolve(__dirname, '../../src/app/page.tsx');
    const src = fs.readFileSync(filePath, 'utf-8');
    expect(src.trimStart().startsWith("'use client'")).toBe(true);
  });

  it('renders a text input and a submit button labeled 생성 or create', async () => {
    await renderPage();
    expect(screen.getByRole('textbox')).toBeDefined();
    const button = screen.getByRole('button', { name: /생성|create/i });
    expect(button).toBeDefined();
  });

  it('POSTs identifying terms to /api/cases on valid submit', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'abc-123' }), { status: 200 })
    );
    await renderPage();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '홍길동' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/cases');
    expect(init.method?.toUpperCase()).toBe('POST');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toMatchObject({ terms: '홍길동' });
  });

  it('navigates to /cases/<newId> via useRouter().push after successful POST', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'abc-123' }), { status: 200 })
    );
    await renderPage();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '홍길동' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/cases/abc-123'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not POST or navigate when input is empty', async () => {
    await renderPage();
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does not POST or navigate when input is whitespace only', async () => {
    await renderPage();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /생성|create/i }));
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
  });
});
