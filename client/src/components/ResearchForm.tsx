import { useState } from 'react';

const MODELS = ['llama3.2', 'llama3.1', 'mistral', 'phi3', 'gemma2'];

interface Props {
  onStart: (topic: string, model: string) => void;
  running: boolean;
}

export default function ResearchForm({ onStart, running }: Props) {
  const [topic, setTopic] = useState('');
  const [model, setModel] = useState('llama3.2');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !running) onStart(topic.trim(), model);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-neutral-500 mb-1.5 tracking-widest uppercase">
          Research Topic
        </label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. quantum computing error correction, AMC competition strategies..."
          rows={3}
          disabled={running}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm
                     text-neutral-200 placeholder-neutral-600 resize-none outline-none
                     focus:border-neutral-600 transition-colors disabled:opacity-50"
        />
      </div>

      <div className="flex items-end gap-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1.5 tracking-widest uppercase">
            Ollama Model
          </label>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            disabled={running}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm
                       text-neutral-300 outline-none focus:border-neutral-600 transition-colors
                       disabled:opacity-50 cursor-pointer"
          >
            {MODELS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!topic.trim() || running}
          className="flex-1 py-2.5 px-6 rounded-lg text-sm font-medium tracking-wide
                     bg-white text-black transition-all
                     hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
              Researching...
            </span>
          ) : (
            'Run Research'
          )}
        </button>
      </div>
    </form>
  );
}
