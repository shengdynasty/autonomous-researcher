import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { runResearchLoop } from '../agent/loop';
import { AgentLogEntry } from '../types';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Start a research run — streams SSE log entries then a final result event
app.post('/api/research', async (req, res) => {
  const { topic, model = 'llama3.2' } = req.body as { topic: string; model?: string };

  if (!topic?.trim()) {
    return res.status(400).json({ error: 'topic is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const result = await runResearchLoop(topic, model, (entry: AgentLogEntry) =>
      send({ type: 'log', entry }),
    );
    send({ type: 'complete', ...result });
  } catch (err) {
    send({ type: 'error', message: (err as Error).message });
  }

  res.end();
});

// List saved reports (newest first)
app.get('/api/reports', (_req, res) => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const stat = fs.statSync(path.join(REPORTS_DIR, f));
      return { filename: f, createdAt: stat.mtime };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json(files);
});

// Get a single report's content
app.get('/api/reports/:filename', (req, res) => {
  const filepath = path.join(REPORTS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Not found' });
  res.type('text/plain').send(fs.readFileSync(filepath, 'utf-8'));
});

app.listen(PORT, () => {
  console.log(`\n  Autonomous Researcher  →  http://localhost:${PORT}\n`);
});
