import { Ollama } from 'ollama';

const ollama = new Ollama();

interface EvalResult {
  score: number;
  reason: string;
}

export async function evaluatePage(
  content: string,
  question: string,
  model: string,
): Promise<EvalResult> {
  if (!content || content.length < 100) {
    return { score: 0, reason: 'Page too short or empty' };
  }

  try {
    const response = await ollama.chat({
      model,
      messages: [{
        role: 'user',
        content: `Rate how relevant this web page is for answering the research question. Be strict.

Research question: "${question}"

Page content (excerpt):
${content.slice(0, 1500)}

Respond with ONLY JSON, no explanation: {"score": <0-10>, "reason": "<one short sentence>"}`,
      }],
      format: 'json',
    });

    const parsed = JSON.parse(response.message.content.trim());
    return {
      score: Number(parsed.score) ?? 0,
      reason: parsed.reason ?? '',
    };
  } catch {
    return { score: 5, reason: 'Evaluation failed, assuming moderate relevance' };
  }
}
