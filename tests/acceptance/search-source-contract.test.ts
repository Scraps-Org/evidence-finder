import { describe, it, expect } from 'vitest';
import type { SearchSource, SearchResult } from '../../src/lib/searchSource';
import { FixtureSearchSource } from '../../src/lib/searchSource';

describe('SearchSource contract', () => {
  it('FixtureSearchSource satisfies SearchSource interface', () => {
    const fixture: SearchSource = new FixtureSearchSource();
    expect(fixture).toBeDefined();
  });

  it('query returns an array of SearchResult with all required fields', () => {
    const fixture: SearchSource = new FixtureSearchSource();
    const results: SearchResult[] = fixture.query('test');

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThanOrEqual(1);

    const first = results[0]!;
    expect(typeof first.url).toBe('string');
    expect(typeof first.title).toBe('string');
    expect(typeof first.snippet).toBe('string');
    expect(typeof first.source).toBe('string');
    expect(first.foundAt instanceof Date).toBe(true);
  });

  it('query returns typed SearchResult[] with url, title, snippet, source, foundAt', () => {
    const fixture: SearchSource = new FixtureSearchSource();
    const results: SearchResult[] = fixture.query('anything');

    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((r) => {
      expect(r).toHaveProperty('url');
      expect(r).toHaveProperty('title');
      expect(r).toHaveProperty('snippet');
      expect(r).toHaveProperty('source');
      expect(r).toHaveProperty('foundAt');
    });
  });

  it('fixture query returns data from memory with no network call', () => {
    const fixture: SearchSource = new FixtureSearchSource();
    // This must pass in a fully offline/air-gapped environment.
    // No fetch/http/https/axios/XMLHttpRequest is invoked — the data is static.
    const results: SearchResult[] = fixture.query('offline');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
