export interface AgentLogEntry {
  stage: 'plan' | 'search' | 'scrape' | 'evaluate' | 'synthesize' | 'complete' | 'error';
  message: string;
  detail?: string;
  timestamp: number;
}
