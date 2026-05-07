import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface ReportFile {
  filename: string;
  createdAt: string;
}

interface Props {
  latestReport: { content: string; filename: string } | null;
}

export default function ReportViewer({ latestReport }: Props) {
  const [reports, setReports] = useState<ReportFile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'latest' | 'saved'>('latest');

  useEffect(() => {
    fetchReports();
  }, [latestReport]);

  useEffect(() => {
    if (latestReport) {
      setContent(latestReport.content);
      setActiveTab('latest');
    }
  }, [latestReport]);

  async function fetchReports() {
    const res = await fetch('/api/reports');
    setReports(await res.json());
  }

  async function loadReport(filename: string) {
    setSelected(filename);
    const res = await fetch(`/api/reports/${filename}`);
    setContent(await res.text());
    setActiveTab('saved');
  }

  if (!latestReport && reports.length === 0) return null;

  return (
    <div className="mt-8 border border-neutral-800 rounded-lg overflow-hidden">
      {/* tab bar */}
      <div className="flex border-b border-neutral-800 bg-neutral-900">
        <button
          onClick={() => { setActiveTab('latest'); if (latestReport) setContent(latestReport.content); }}
          className={`px-5 py-2.5 text-xs tracking-widest uppercase transition-colors
            ${activeTab === 'latest' ? 'text-white border-b border-white' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          Latest Report
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-5 py-2.5 text-xs tracking-widest uppercase transition-colors
            ${activeTab === 'saved' ? 'text-white border-b border-white' : 'text-neutral-500 hover:text-neutral-300'}`}
        >
          Saved ({reports.length})
        </button>
      </div>

      <div className="flex min-h-64">
        {/* saved reports sidebar */}
        {activeTab === 'saved' && (
          <div className="w-64 border-r border-neutral-800 overflow-y-auto bg-[#0a0a0a]">
            {reports.length === 0 ? (
              <p className="p-4 text-xs text-neutral-600">No saved reports yet.</p>
            ) : (
              reports.map(r => (
                <button
                  key={r.filename}
                  onClick={() => loadReport(r.filename)}
                  className={`w-full text-left px-4 py-3 text-xs border-b border-neutral-800/50
                    transition-colors hover:bg-neutral-800/50
                    ${selected === r.filename ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
                >
                  <div className="truncate">{r.filename.replace(/\.md$/, '')}</div>
                  <div className="text-neutral-600 mt-0.5">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* report content */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[600px] bg-[#0a0a0a]">
          {content ? (
            <div className="report-body">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-neutral-600">Select a report to view.</p>
          )}
        </div>
      </div>
    </div>
  );
}
