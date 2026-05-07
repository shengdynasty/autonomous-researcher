import { useEffect, useRef } from 'react';
import { AgentLogEntry } from '../types';

const STAGE_COLORS: Record<AgentLogEntry['stage'], string> = {
  plan:       'text-violet-400',
  search:     'text-blue-400',
  scrape:     'text-yellow-400',
  evaluate:   'text-orange-400',
  synthesize: 'text-emerald-400',
  complete:   'text-green-400',
  error:      'text-red-400',
};

const STAGE_LABELS: Record<AgentLogEntry['stage'], string> = {
  plan:       'PLAN',
  search:     'SRCH',
  scrape:     'FETCH',
  evaluate:   'EVAL',
  synthesize: 'SYNC',
  complete:   'DONE',
  error:      'ERR ',
};

interface Props {
  logs: AgentLogEntry[];
  running: boolean;
}

export default function AgentLog({ logs, running }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="mt-6 border border-neutral-800 rounded-lg overflow-hidden">
      {/* terminal header bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-neutral-500 tracking-widest">
          agent.log {running && <span className="animate-pulse">●</span>}
        </span>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto space-y-1 bg-[#0a0a0a]">
        {logs.map((entry, i) => (
          <div key={i} className="flex gap-3 text-xs leading-relaxed">
            <span className={`shrink-0 w-12 font-medium ${STAGE_COLORS[entry.stage]}`}>
              {STAGE_LABELS[entry.stage]}
            </span>
            <span className="text-neutral-300">{entry.message}</span>
            {entry.detail && (
              <span className="text-neutral-600 truncate max-w-xs">{entry.detail}</span>
            )}
          </div>
        ))}

        {running && (
          <div className="flex gap-3 text-xs">
            <span className="w-12 text-neutral-600">····</span>
            <span className="text-neutral-600 animate-pulse">thinking...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
