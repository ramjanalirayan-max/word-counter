import React, { useRef, useEffect, useState } from 'react';
import { WordToken, PlaybackStatus } from '../types';
import { SAMPLE_TEXTS } from '../data/voices';
import {
  Edit3,
  Sparkles,
  BookOpen,
  Volume2,
  Copy,
  ClipboardPaste,
  Trash2,
  Check,
  Headphones,
  Undo2,
} from 'lucide-react';

interface TextSectionProps {
  text: string;
  onChangeText: (text: string) => void;
  tokens: WordToken[];
  activeWordIndex: number;
  playbackStatus: PlaybackStatus;
  onSelectSample: (sampleText: string) => void;
  onPronounceWord?: (word: string) => void;
}

export const TextSection: React.FC<TextSectionProps> = ({
  text,
  onChangeText,
  tokens,
  activeWordIndex,
  playbackStatus,
  onSelectSample,
  onPronounceWord,
}) => {
  const isPlaying = playbackStatus === 'playing' || playbackStatus === 'generating';
  const isPaused = playbackStatus === 'paused';
  const isActive = isPlaying || isPaused;

  const [activeTab, setActiveTab] = useState<'editor' | 'karaoke'>('editor');
  const [copied, setCopied] = useState(false);
  const [prevText, setPrevText] = useState<string | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const karaokeScrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Automatically switch to Karaoke tab when speech starts so the user sees live word-by-word tracking
  useEffect(() => {
    if (isPlaying) {
      setActiveTab('karaoke');
    }
  }, [isPlaying]);

  // Smooth scroll strictly within the local karaoke container - NEVER scroll the global window!
  useEffect(() => {
    if (activeTab === 'karaoke' && activeWordRef.current && karaokeScrollContainerRef.current) {
      const container = karaokeScrollContainerRef.current;
      const el = activeWordRef.current;
      const elTop = el.offsetTop - container.offsetTop;
      const elBottom = elTop + el.offsetHeight;
      const cTop = container.scrollTop;
      const cBottom = cTop + container.clientHeight;

      if (elTop < cTop || elBottom > cBottom) {
        container.scrollTo({
          top: Math.max(0, elTop - container.clientHeight / 2 + el.offsetHeight / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [activeWordIndex, activeTab]);

  const handleCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setPrevText(text);
        onChangeText(clipText);
      }
    } catch (e) {
      // Fallback focus to textarea
      setActiveTab('editor');
      textareaRef.current?.focus();
    }
  };

  const handleClear = () => {
    if (!text) return;
    setPrevText(text);
    onChangeText('');
  };

  const handleUndo = () => {
    if (prevText !== null) {
      onChangeText(prevText);
      setPrevText(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              Script &amp; Text Input
              {isActive && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                  Active Speech
                </span>
              )}
            </h2>
            <p className="text-xs text-stone-600">
              Type or paste your speech text with synchronized word focus
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Seamless navigation between Karaoke and Editor) */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('karaoke')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'karaoke'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-amber-400" />
              <span>Karaoke &amp; Focus</span>
              {isActive && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Sample Prompts Bar */}
      <div className="flex items-center justify-between gap-2 py-2 px-1 border-b border-stone-100 mb-3 overflow-x-auto text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-stone-400" /> Samples:
          </span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrevText(text);
                onSelectSample(sample.text);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200/80 whitespace-nowrap transition-colors active:scale-95 cursor-pointer"
            >
              {sample.title}
            </button>
          ))}
        </div>

        {/* Text Utility Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {prevText !== null && (
            <button
              type="button"
              onClick={handleUndo}
              title="Undo last action"
              className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1 transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              <span>Undo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1 transition-colors active:scale-95"
          >
            <ClipboardPaste className="w-3 h-3 text-stone-600" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!text.trim()}
            title="Copy text to clipboard"
            className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 disabled:opacity-40 text-stone-700 flex items-center gap-1 transition-colors active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-600" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!text}
            title="Clear text"
            className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-100 hover:bg-red-50 hover:text-red-700 disabled:opacity-40 text-stone-700 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Tab-switched smoothly */}
      <div className="relative rounded-xl border border-stone-200 bg-stone-50/40 focus-within:border-stone-400 focus-within:bg-white transition-all overflow-hidden min-h-[160px]">
        {activeTab === 'karaoke' ? (
          /* KARAOKE & WORD FOCUS VIEW */
          <div
            ref={karaokeScrollContainerRef}
            className="p-4 sm:p-5 min-h-[160px] max-h-[260px] overflow-y-auto leading-relaxed text-sm text-stone-800 space-y-3"
          >
            {tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-stone-400 text-center">
                <Edit3 className="w-8 h-8 stroke-1 mb-2 text-stone-300" />
                <p className="text-xs">No text entered yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className="mt-2 text-xs font-semibold text-stone-900 underline"
                >
                  Switch to Editor to write or paste text
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {tokens.map((token, index) => {
                    const isCurrent = activeWordIndex === index;
                    const isPast = activeWordIndex > index;

                    return (
                      <button
                        key={token.id}
                        type="button"
                        ref={isCurrent ? activeWordRef : null}
                        onClick={() => onPronounceWord && onPronounceWord(token.cleanWord)}
                        title={`Click to pronounce "${token.cleanWord}"`}
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-400 text-stone-950 font-bold scale-110 shadow-md ring-2 ring-amber-300 ring-offset-1 z-10'
                            : isPast
                            ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-200/50'
                            : 'text-stone-800 hover:bg-amber-50 hover:text-amber-900 border border-transparent hover:border-amber-200'
                        }`}
                      >
                        <span>{token.word}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Focus Status & Quick Helper */}
                <div className="pt-3 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <span className="flex items-center gap-0.5 h-3">
                        <span className="w-1 bg-amber-500 rounded-full h-2 animate-bounce"></span>
                        <span className="w-1 bg-amber-500 rounded-full h-3.5 animate-bounce [animation-delay:0.15s]"></span>
                        <span className="w-1 bg-amber-500 rounded-full h-1.5 animate-bounce [animation-delay:0.3s]"></span>
                      </span>
                    )}
                    <span>
                      {activeWordIndex >= 0 && activeWordIndex < tokens.length ? (
                        <>
                          Focusing word <strong className="text-stone-900">{activeWordIndex + 1}</strong> of{' '}
                          <strong className="text-stone-900">{tokens.length}</strong>:{' '}
                          <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                            &quot;{tokens[activeWordIndex].cleanWord}&quot;
                          </span>
                        </>
                      ) : isPlaying ? (
                        'Synchronizing speech cadence...'
                      ) : (
                        <span className="text-stone-500 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5 text-stone-400" /> Click any word above to audition its pronunciation
                        </span>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('editor')}
                    className="text-[11px] font-semibold text-stone-800 hover:text-stone-950 flex items-center gap-1 underline self-start sm:self-auto"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Text
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* SCRIPT EDITOR VIEW */
          <textarea
            ref={textareaRef}
            id="voice-script-input"
            rows={5}
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            placeholder="Type or paste your text here. E.g. 'Good morning! The weather in London is rather brisk today, whereas Sydney is enjoying radiant sunshine.'"
            className="w-full p-4 bg-transparent resize-y text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden min-h-[160px] max-h-[320px] leading-relaxed"
          />
        )}
      </div>

      {/* Footer Meta Statistics */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-stone-600 px-1">
        <div className="flex items-center gap-3">
          <span>
            Characters: <strong className="text-stone-800 font-mono">{text.length}</strong>
          </span>
          <span>•</span>
          <span>
            Words: <strong className="text-stone-800 font-mono">{tokens.length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-stone-600">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px]">Real-time word synchronization &amp; audio boundary tracking</span>
        </div>
      </div>
    </section>
  );
};
