export interface SubQuestion {
  question: string;
  searchQuery: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface AgentLogEntry {
  stage: 'plan' | 'search' | 'scrape' | 'evaluate' | 'synthesize' | 'complete' | 'error';
  message: string;
  detail?: string;
  timestamp: number;
}
