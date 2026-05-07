import axios from 'axios';
import * as cheerio from 'cheerio';
import { SearchResult } from '../types';

export async function search(query: string, maxResults = 5): Promise<SearchResult[]> {
  try {
    const response = await axios.post(
      'https://html.duckduckgo.com/html/',
      new URLSearchParams({ q: query }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 12000,
      }
    );

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((i, el) => {
      if (results.length >= maxResults) return false;

      const titleEl = $(el).find('.result__title a');
      const snippet = $(el).find('.result__snippet').text().trim();
      const href = titleEl.attr('href') ?? '';
      const title = titleEl.text().trim();

      // DDG wraps real URLs in a redirect — extract the uddg param
      let url = '';
      const match = href.match(/uddg=([^&]+)/);
      if (match) {
        url = decodeURIComponent(match[1]);
      } else if (href.startsWith('http')) {
        url = href;
      }

      if (title && url && !url.includes('duckduckgo.com')) {
        results.push({ title, url, snippet });
      }
    });

    return results;
  } catch (err) {
    console.error('[searcher] error:', (err as Error).message);
    return [];
  }
}
