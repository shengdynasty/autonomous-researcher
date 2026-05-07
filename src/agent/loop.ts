import { planResearch } from './planner';
import { search } from './searcher';
import { scrapeUrl } from './scraper';
import { evaluatePage } from './evaluator';
import { synthesize } from './synthesizer';
import { AgentLogEntry } from '../types';

export type LogCallback = (entry: AgentLogEntry) => void;

const RELEVANCE_THRESHOLD = 5;
const MAX_RETRY_ATTEMPTS = 3;

export async function runResearchLoop(
  topic: string,
  model: string,
  onLog: LogCallback,
): Promise<{ report: string; filename: string; sources: string[] }> {
  const log = (stage: AgentLogEntry['stage'], message: string, detail?: string) =>
    onLog({ stage, message, detail, timestamp: Date.now() });

  // Stage 1: Plan
  log('plan', `Planning research for: "${topic}"...`);
  const subQuestions = await planResearch(topic, model);
  for (const sq of subQuestions) {
    log('plan', `→ ${sq.question}`, sq.searchQuery);
  }

  const goodPages: { question: string; content: string; url: string }[] = [];
  const allSources: string[] = [];

  // Stages 2–3: Search → Scrape → Evaluate per sub-question
  for (const sq of subQuestions) {
    log('search', `Searching: "${sq.searchQuery}"`);

    let currentQuery = sq.searchQuery;
    let foundGood = false;

    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS && !foundGood; attempt++) {
      const results = await search(currentQuery);

      if (results.length === 0) {
        log('search', `No results for "${currentQuery}", refining...`);
        currentQuery = `${sq.searchQuery} explained overview`;
        continue;
      }

      for (const result of results.slice(0, 4)) {
        log('scrape', `Fetching: ${result.title}`, result.url);
        const content = await scrapeUrl(result.url);

        if (!content) {
          log('evaluate', `✗ Could not scrape`, result.url);
          continue;
        }

        log('evaluate', `Evaluating relevance...`, result.title);
        const { score, reason } = await evaluatePage(content, sq.question, model);

        if (score >= RELEVANCE_THRESHOLD) {
          log('evaluate', `✓ ${score}/10 — ${reason}`);
          goodPages.push({ question: sq.question, content, url: result.url });
          allSources.push(result.url);
          foundGood = true;
          break;
        } else {
          log('evaluate', `✗ ${score}/10 — ${reason}`);
        }
      }

      if (!foundGood && attempt < MAX_RETRY_ATTEMPTS - 1) {
        currentQuery = `${sq.searchQuery} ${attempt === 1 ? 'guide' : 'research'}`;
        log('search', `Retrying with: "${currentQuery}"`);
      }
    }

    if (!foundGood) {
      log('search', `Could not find good source for: "${sq.question}" — skipping`);
    }
  }

  if (goodPages.length === 0) {
    log('error', 'No relevant sources found. Try a broader topic or check Ollama is running.');
    throw new Error('No sufficient sources found');
  }

  // Stage 4: Synthesize
  log('synthesize', `Writing report from ${goodPages.length} source${goodPages.length !== 1 ? 's' : ''}...`);
  const { report, filename } = await synthesize(topic, goodPages, model);

  log('complete', `Report saved → reports/${filename}`);

  return { report, filename, sources: allSources };
}
