import { useState, useRef } from 'react';
import ResearchForm from './components/ResearchForm';
import AgentLog from './components/AgentLog';
import ReportViewer from './components/ReportViewer';
import { AgentLogEntry } from './types';

interface StreamEvent {
  type: 'log' | 'complete' | 'error';
  entry?: AgentLogEntry;
  report?: string;
  filename?: string;
  sources?: string[];
  message?: string;
}

export default function App() {
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [latestReport, setLatestReport] = useState<{ content: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function handleStart(topic: string, model: string) {
    setLogs([]);
    setError(null);
    setLatestReport(null);
    setRunning(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, model }),
        signal: abortRef.current.signal,
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));

            if (event.type === 'log' && event.entry) {
              setLogs(prev => [...prev, event.entry!]);
            } else if (event.type === 'complete' && event.report && event.filename) {
              setLatestReport({ content: event.report, filename: event.filename });
            } else if (event.type === 'error') {
              setError(event.message ?? 'Unknown error');
            }
          } catch {
            // malformed SSE chunk, skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
      }
    } finally {
      setRunning(false);
    }
  }

  function handleStop() {
    abortRef.current?.abort();
    setRunning(false);
  }

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-200">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* header */}
        <div className="mb-12">
          <p className="text-xs text-neutral-600 tracking-widest uppercase mb-3">
            Local AI · No API Key
          </p>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-3">
            Autonomous Researcher
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Enter a topic. The agent plans sub-questions, searches the web, evaluates sources,
            and writes a cited report — entirely on your machine via Ollama.
          </p>
        </div>

        {/* form */}
        <ResearchForm onStart={handleStart} running={running} />

        {/* stop button */}
        {running && (
          <button
            onClick={handleStop}
            className="mt-3 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            ✕ stop
          </button>
        )}

        {/* error */}
        {error && (
          <div className="mt-4 px-4 py-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* live log */}
        <AgentLog logs={logs} running={running} />

        {/* report viewer */}
        <ReportViewer latestReport={latestReport} />

        {/* footer */}
        <p className="mt-16 text-xs text-neutral-700 text-center">
          Powered by Ollama · Reports saved to <code className="text-neutral-600">./reports/</code>
        </p>
      </div>
    </div>
  );
}
