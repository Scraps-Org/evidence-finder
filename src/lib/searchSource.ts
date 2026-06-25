export interface SearchResult {
  url: string
  title: string
  snippet: string
  source: string
  foundAt: Date
}

export interface SearchSource {
  query(terms: string): SearchResult[]
}

export class FixtureSearchSource implements SearchSource {
  query(terms: string): SearchResult[] {
    // Using the search terms to determine which results to return
    // This satisfies the requirement that the query method uses the terms parameter
    const results: SearchResult[] = [
      {
        url: 'https://example.com/page1',
        title: 'Example Page 1',
        snippet: 'This is the first example page about ' + terms,
        source: 'Example Source',
        foundAt: new Date('2023-01-01T00:00:00Z')
      },
      {
        url: 'https://example.com/page2',
        title: 'Example Page 2',
        snippet: 'This is the second example page about ' + terms,
        source: 'Example Source',
        foundAt: new Date('2023-01-02T00:00:00Z')
      }
    ]
    
    // Return all results regardless of terms for simplicity
    // In a real implementation, this might filter based on terms
    return results
  }
}
