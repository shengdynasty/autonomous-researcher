import { Ollama } from 'ollama';
import { SubQuestion } from '../types';

const ollama = new Ollama();

export async function planResearch(topic: string, model: string): Promise<SubQuestion[]> {
  const response = await ollama.chat({
    model,
    messages: [{
      role: 'user',
      content: `You are a research planning agent. Given a topic, generate exactly 4 specific sub-questions that together give a comprehensive understanding. Each sub-question must be independently searchable.

Topic: "${topic}"

Respond with ONLY a JSON array. No explanation, no markdown, just raw JSON.
Format:
[
  {"question": "...", "searchQuery": "..."},
  {"question": "...", "searchQuery": "..."},
  {"question": "...", "searchQuery": "..."},
  {"question": "...", "searchQuery": "..."}
]

The searchQuery should be concise and keyword-focused (good for web search).`,
    }],
    format: 'json',
  });

  try {
    const raw = response.message.content.trim();
    const parsed = JSON.parse(raw);
    const questions: SubQuestion[] = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
    if (questions.length > 0) return questions;
  } catch {
    // fall through to default
  }

  return [
    { question: `What is ${topic}?`, searchQuery: topic },
    { question: `Latest developments in ${topic}`, searchQuery: `${topic} latest 2025` },
    { question: `Key challenges in ${topic}`, searchQuery: `${topic} challenges` },
    { question: `Future outlook for ${topic}`, searchQuery: `${topic} future trends` },
  ];
}
