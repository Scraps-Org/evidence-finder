import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EvidenceList from '../../src/components/EvidenceList';

const EVIDENCE_ROWS = [
  {
    id: 'ev-1',
    url: 'https://example.com/page',
    detectedAt: '2026-06-01T10:00:00.000Z',
    pageTitle: 'Example Page',
    domain: 'example.com',
  },
  {
    id: 'ev-2',
    url: 'https://other.org/article',
    detectedAt: '2026-06-02T12:00:00.000Z',
    pageTitle: 'Other Article',
    domain: 'other.org',
  },
];

describe('D5-export-csv — UI: export control triggers file download', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.fn>;
  let removeChildSpy: ReturnType<typeof vi.fn>;
  let createdAnchor: HTMLAnchorElement;

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: revokeObjectURLSpy,
    });

    createdAnchor = document.createElement('a');
    clickSpy = vi.fn();
    createdAnchor.click = clickSpy;

    const origCreateElement = document.createElement.bind(document);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return createdAnchor;
      return origCreateElement(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('activating the export control triggers a blob download, not a navigate or inline render', () => {
    render(<EvidenceList evidence={EVIDENCE_ROWS} caseId="case-1" />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);

    // A Blob URL must have been created (file download path)
    expect(createObjectURLSpy).toHaveBeenCalledOnce();

    // The anchor must carry a download attribute (not a navigation href)
    expect(createdAnchor.download).toBeTruthy();

    // The anchor click must have been called to trigger the download
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
