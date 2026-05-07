import axios from 'axios';
import * as cheerio from 'cheerio';

export async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
      maxRedirects: 3,
    });

    const $ = cheerio.load(response.data);

    // Strip boilerplate
    $('script, style, nav, footer, header, aside, .sidebar, .ad, .menu, [role="navigation"]').remove();

    // Prefer semantic content containers
    const container = $('article, main, [role="main"], .content, .post-content, .entry-content').first();
    const text = (container.length ? container : $('body'))
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000);

    return text;
  } catch {
    return '';
  }
}
