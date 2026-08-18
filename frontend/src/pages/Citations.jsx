import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronDown, Copy, Loader2, Sparkles } from 'lucide-react';
import { generateCitation, getUserCitations } from '../services/citationService';

const CitationCard = ({ title, value, onCopy, copied }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/20">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-amber-500 hover:text-amber-400"
      >
        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
    <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm leading-6 text-slate-100 whitespace-pre-wrap break-words">
      {value}
    </div>
  </div>
);

export default function Citations() {
  const [source, setSource] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [copiedFormat, setCopiedFormat] = useState('');
  const [expandedCitationIds, setExpandedCitationIds] = useState([]);

  const loadHistory = async () => {
    try {
      const response = await getUserCitations();
      setHistory(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to load your saved citations.');
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      const response = await generateCitation({ source });
      const savedCitation = response.data;
      setResult(savedCitation);
      setHistory((prev) => [savedCitation, ...prev]);
      setSource('');
    } catch (err) {
      setError(err.message || 'Unable to create a citation right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedFormat(label);
      setTimeout(() => setCopiedFormat(''), 1500);
    } catch {
      setError('Clipboard access was blocked.');
    }
  };

  const toggleCitation = (citationId) => {
    setExpandedCitationIds((current) =>
      current.includes(citationId)
        ? current.filter((id) => id !== citationId)
        : [...current, citationId]
    );
  };

  const preview = useMemo(() => {
    if (!result) return null;
    return {
      apa: result.formats?.apa || result.generatedCitation || '',
      mla: result.formats?.mla || '',
      bibtex: result.formats?.bibtex || '',
    };
  }, [result]);

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-600/20 p-3 text-amber-400">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Citation Generator</h1>
            <p className="mt-1 text-sm text-slate-400">Paste a DOI or a research link to generate APA, MLA, and BibTeX citations instantly.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="source">
            DOI or article URL
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              id="source"
              type="text"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="e.g. 10.1038/s41586-021-03819-2 or https://doi.org/10.1038/..."
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isGenerating || !source.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:bg-slate-700"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate
            </button>
          </div>
        </form>

        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </div>

      {preview ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <CitationCard
            title="APA"
            value={preview.apa}
            copied={copiedFormat === 'APA'}
            onCopy={() => handleCopy('APA', preview.apa)}
          />
          <CitationCard
            title="MLA"
            value={preview.mla}
            copied={copiedFormat === 'MLA'}
            onCopy={() => handleCopy('MLA', preview.mla)}
          />
          <div className="xl:col-span-2">
            <CitationCard
              title="BibTeX"
              value={preview.bibtex}
              copied={copiedFormat === 'BibTeX'}
              onCopy={() => handleCopy('BibTeX', preview.bibtex)}
            />
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Saved citations</h2>
            <p className="text-sm text-slate-400">Your citations are saved automatically so you can revisit them later.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
            No citations saved yet. Generate one to see it here.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <button
                  type="button"
                  onClick={() => toggleCitation(item._id)}
                  className="flex w-full items-center justify-between gap-3 text-left transition hover:opacity-90"
                >
                  <div>
                    <h3 className="text-base font-semibold text-white">{item.sourceTitle || 'Untitled source'}</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform ${
                      expandedCitationIds.includes(item._id) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedCitationIds.includes(item._id) ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.doi || item.sourceUrl}</p>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">APA</p>
                        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm leading-6 text-slate-100 whitespace-pre-wrap break-words">
                          {item.formats?.apa || item.generatedCitation}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">MLA</p>
                        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm leading-6 text-slate-100 whitespace-pre-wrap break-words">
                          {item.formats?.mla}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">BibTeX</p>
                        <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-sm leading-6 text-slate-100 whitespace-pre-wrap break-words">
                          {item.formats?.bibtex}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
