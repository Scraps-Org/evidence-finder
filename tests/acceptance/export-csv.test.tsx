import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE_ROWS = [
  {
    id: '1',
    url: 'https://example.com/page1',
    detectedAt: '2026-06-25T10:00:00.000Z',
    pageTitle: 'Page One',
    domain: 'example.com',
  },
  {
    id: '2',
    url: 'https://example.com/page2',
    detectedAt: '2026-06-25T11:00:00.000Z',
    pageTitle: 'Page Two',
    domain: 'example.com',
  },
];

describe('D5-export-csv UI: export control triggers file download', () => {
  let createdUrl: string | null = null;
  let anchorClickSpy: ReturnType<typeof vi.fn>;
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.fn>;
  let removeChildSpy: ReturnType<typeof vi.fn>;
  let mockAnchor: { href: string; download: string; click: ReturnType<typeof vi.fn>; style: { display: string } };

  beforeEach(() => {
    createdUrl = 'blob:mock-url';
    anchorClickSpy = vi.fn();
    createObjectURLSpy = vi.fn(() => createdUrl as string);
    revokeObjectURLSpy = vi.fn();
    appendChildSpy = vi.fn();
    removeChildSpy = vi.fn();

    mockAnchor = { href: '', download: '', click: anchorClickSpy, style: { display: '' } };

    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return mockAnchor as unknown as HTMLElement;
      return document.createElement.call(document, tag) as HTMLElement;
    });

    appendChildSpy = vi.spyOn(document.body, 'appendChild') as unknown as ReturnType<typeof vi.fn>;
    removeChildSpy = vi.spyOn(document.body, 'removeChild') as unknown as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('Given evidence rows exist, When the export control is activated, Then a file download is triggered (not inline render or redirect)', async () => {
    render(<EvidenceList evidence={EVIDENCE_ROWS} />);

    const exportButton = screen.getByRole('button', { name: /export.*csv|download.*csv|csv/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalled();
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(mockAnchor.download).toMatch(/\.csv$/i);
    expect(mockAnchor.href).toBe(createdUrl);
  });
});
