export interface BraveCandidate {
  url: string;
  title: string;
  snippet: string;
  source: string;
  foundAt: Date;
}

interface BraveWebResult {
  url: string;
  title?: string;
  description?: string;
}

export class BraveSource {
  async search(terms: string): Promise<BraveCandidate[]> {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(terms)}`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': process.env.BRAVE_API_KEY ?? '',
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    const data: { web?: { results?: BraveWebResult[] } } = await res.json();

    return (data?.web?.results ?? []).map((r) => ({
      url: r.url,
      title: r.title ?? '',
      snippet: r.description ?? '',
      source: 'brave',
      foundAt: new Date(),
    }));
  }
}
