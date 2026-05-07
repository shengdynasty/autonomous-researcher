import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';

const ollama = new Ollama();

interface PageData {
  question: string;
  content: string;
  url: string;
}

export async function synthesize(
  topic: string,
  pages: PageData[],
  model: string,
): Promise<{ report: string; filename: string }> {
  const sourcesContext = pages
    .map((p, i) => `[${i + 1}] ${p.question}\nSource: ${p.url}\n${p.content.slice(0, 1000)}`)
    .join('\n\n---\n\n');

  const response = await ollama.chat({
    model,
    messages: [{
      role: 'user',
      content: `Write a comprehensive research report on the following topic using the provided sources.

Topic: "${topic}"

Sources:
${sourcesContext}

Format the report in Markdown:
- Start with a brief executive summary (2-3 sentences)
- Key findings organized by theme (use ## headers)
- A conclusion paragraph
- A ## References section listing each source URL with its number

Use inline citations like [1], [2] etc. Aim for 500-700 words. Be factual and specific.`,
    }],
  });

  const reportBody = response.message.content;
  const date = new Date().toISOString().split('T')[0];
  const slug = topic
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40);
  const filename = `${slug}-${date}.md`;

  const reportsDir = path.join(process.cwd(), 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const fullReport = `# ${topic}\n*Generated ${date} · ${pages.length} sources*\n\n${reportBody}`;
  fs.writeFileSync(path.join(reportsDir, filename), fullReport, 'utf-8');

  return { report: fullReport, filename };
}
