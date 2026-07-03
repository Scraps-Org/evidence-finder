import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';

const DETECTED_URL = 'https://evil.example.com/leaked-image-page';

const sampleEvidence = [
  {
    id: 'ev-1',
    url: DETECTED_URL,
    pageTitle: 'Leaked Page',
    domain: 'evil.example.com',
    detectedAt: '2026-07-03T09:00:00.000Z',
    caseId: 'case-1',
  },
];

vi.mock('../../src/lib/prisma', () => ({
  default: {
    evidence: {
      findMany: vi.fn().mockResolvedValue(sampleEvidence),
    },
  },
}));

describe('EvidenceList UI', () => {
  it('renders URL text, pageTitle, domain, and detectedAt for each evidence item', async () => {
    const { EvidenceList } = await import('../../src/components/EvidenceList');
    render(<EvidenceList evidence={sampleEvidence} />);

    expect(screen.getByText(DETECTED_URL)).toBeInTheDocument();
    expect(screen.getByText('Leaked Page')).toBeInTheDocument();
    expect(screen.getByText(/evil\.example\.com/)).toBeInTheDocument();
    expect(
      screen.getByText(/2026-07-03|2026|07|03/),
    ).toBeInTheDocument();
  });

  it('does not render any <img> or <video> element whose src references the detected URL', async () => {
    const { EvidenceList } = await import('../../src/components/EvidenceList');
    const { container } = render(<EvidenceList evidence={sampleEvidence} />);

    const imgs = container.querySelectorAll('img');
    const videos = container.querySelectorAll('video');

    imgs.forEach((img) => {
      expect(img.getAttribute('src')).not.toBe(DETECTED_URL);
    });
    videos.forEach((video) => {
      expect(video.getAttribute('src')).not.toBe(DETECTED_URL);
    });

    // Explicitly confirm no media element carries the detected URL as src
    const allMedia = [...Array.from(imgs), ...Array.from(videos)];
    const violating = allMedia.filter(
      (el) => el.getAttribute('src') === DETECTED_URL,
    );
    expect(violating).toHaveLength(0);
  });

  it('renders evidence metadata items in a list', async () => {
    const evidenceWithTwo = [
      ...sampleEvidence,
      {
        id: 'ev-2',
        url: 'https://another.example.com/page',
        pageTitle: 'Another Page',
        domain: 'another.example.com',
        detectedAt: '2026-07-03T10:00:00.000Z',
        caseId: 'case-1',
      },
    ];
    const { EvidenceList } = await import('../../src/components/EvidenceList');
    render(<EvidenceList evidence={evidenceWithTwo} />);

    const items = screen.getAllByRole('listitem');
    // Each evidence item is represented; no <img>/<video> with those URLs
    const firstItem = items[0]!;
    const secondItem = items[1]!;

    expect(within(firstItem).queryByRole('img')).toBeNull();
    expect(within(secondItem).queryByRole('img')).toBeNull();
  });
});
