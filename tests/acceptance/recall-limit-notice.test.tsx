import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CaseDetailPage from '../../src/app/cases/[caseId]/page';

describe('D9-recall-and-referral: recall-limit notice and referral links', () => {
  it('renders a static notice asserting public-index-only coverage and manual-reporting requirement for closed platforms', async () => {
    const Page = await CaseDetailPage({ params: Promise.resolve({ caseId: 'test-case-id' }) });
    render(Page);

    const pageText = document.body.textContent ?? '';

    const coversPublicIndex = /공개.{0,30}색인|publicly.{0,30}index|public.{0,30}index/i.test(
      pageText,
    );
    expect(
      coversPublicIndex,
      'Notice must state that results reflect only publicly-indexed exposure',
    ).toBe(true);

    const coversClosedPlatforms =
      /텔레그램|telegram|포럼|forum|폐쇄|closed.{0,20}platform|manual.{0,20}report|수동.{0,10}신고/i.test(
        pageText,
      );
    expect(
      coversClosedPlatforms,
      'Notice must state that closed platforms like Telegram/forums require manual reporting',
    ).toBe(true);
  });

  it('renders individual navigable links to StopNCII.org, NCMEC Take It Down, and Google explicit-image removal', async () => {
    const Page = await CaseDetailPage({ params: Promise.resolve({ caseId: 'test-case-id' }) });
    render(Page);

    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => (l as HTMLAnchorElement).href);

    const hasStopNCII = hrefs.some((h) => /stopncii\.org/i.test(h));
    expect(hasStopNCII, 'A link to stopncii.org must be present').toBe(true);

    const hasNCMEC = hrefs.some((h) => /takeitdown\.ncmec\.org|ncmec/i.test(h));
    expect(hasNCMEC, 'A link to NCMEC Take It Down must be present').toBe(true);

    const hasGoogle = hrefs.some((h) =>
      /support\.google\.com|google\.com.*remov|google\.com.*explicit/i.test(h),
    );
    expect(hasGoogle, 'A link to Google explicit-image removal must be present').toBe(true);
  });

  it('referral links are plain anchors/navigation links only — none invoke, embed, or trigger scanning', async () => {
    const Page = await CaseDetailPage({ params: Promise.resolve({ caseId: 'test-case-id' }) });
    render(Page);

    const referralPatterns = [
      /stopncii\.org/i,
      /takeitdown\.ncmec\.org|ncmec/i,
      /support\.google\.com|google\.com.*remov|google\.com.*explicit/i,
    ];

    const links = screen.getAllByRole('link');

    for (const pattern of referralPatterns) {
      const matchingLinks = links.filter((l) => pattern.test((l as HTMLAnchorElement).href));
      expect(matchingLinks.length, `Referral link matching ${pattern} must exist`).toBeGreaterThan(
        0,
      );

      for (const link of matchingLinks) {
        const anchor = link as HTMLAnchorElement;
        expect(anchor.tagName.toLowerCase(), 'Referral must be rendered as an <a> element').toBe(
          'a',
        );
        expect(anchor.href, 'Referral <a> must have a non-empty href').toBeTruthy();
        const onClickAttr = anchor.getAttribute('onclick');
        expect(
          onClickAttr,
          'Referral link must not have an onclick attribute that could trigger scanning',
        ).toBeNull();
      }
    }
  });
});
