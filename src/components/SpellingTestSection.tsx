import React, { useState, useEffect, useRef } from 'react';
import { Accent, Gender, PlaybackStatus, WordToken } from '../types';
import { AccentSpeechEngine } from '../utils/speechEngine';
import {
  PenTool,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Volume2,
  Play,
  Square,
  Award,
  Sparkles,
  HelpCircle,
  Check,
  X,
  Clock,
} from 'lucide-react';

interface SpellingTestSectionProps {
  tokens: WordToken[];
  fullText: string;
  playbackStatus: PlaybackStatus;
  currentWordIndex: number;
  accent: Accent;
  gender: Gender;
  speechEngine: AccentSpeechEngine;
  isWordTimeoutActive: boolean;
  pauseDurationMs: number;
  onGenerateAndPlay: () => void;
  onStop: () => void;
}

export const SpellingTestSection: React.FC<SpellingTestSectionProps> = ({
  tokens,
  fullText,
  playbackStatus,
  currentWordIndex,
  accent,
  gender,
  speechEngine,
  isWordTimeoutActive,
  pauseDurationMs,
  onGenerateAndPlay,
  onStop,
}) => {
  // Target words derived from the text input
  const targetWords = tokens.map((t) => t.cleanWord);

  // Typed words entered by the user
  const [typedWords, setTypedWords] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [activeWordCursor, setActiveWordCursor] = useState<number>(0);
  const [testState, setTestState] = useState<'idle' | 'in_progress' | 'completed'>('idle');
  const [playingSingleWord, setPlayingSingleWord] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const wasPlayingRef = useRef<boolean>(false);

  const isPlaying = playbackStatus === 'playing';
  const isAudioActive = playbackStatus === 'playing' || playbackStatus === 'generating' || playbackStatus === 'paused';

  // Detect when audio starts playing to automatically set test state if idle
  useEffect(() => {
    if (isPlaying) {
      wasPlayingRef.current = true;
      if (testState === 'idle') {
        setTestState('in_progress');
        setTypedWords([]);
        setCurrentInput('');
        setActiveWordCursor(0);
      }
    }
  }, [isPlaying]);

  // When audio transitions from active to finished/idle, stop typing and mark test completed
  useEffect(() => {
    if (wasPlayingRef.current && (playbackStatus === 'idle' || playbackStatus === 'finished')) {
      wasPlayingRef.current = false;
      // Commit any pending typed word in the input
      if (currentInput.trim()) {
        setTypedWords((prev) => {
          const updated = [...prev];
          updated[activeWordCursor] = currentInput.trim();
          return updated;
        });
        setCurrentInput('');
      }
      setTestState('completed');
    }
  }, [playbackStatus, currentInput, activeWordCursor]);

  // Clean comparison helper: lowercase and strip punctuation
  const cleanForComparison = (w: string) =>
    (w || '').toLowerCase().replace(/[^a-z0-9']/gi, '').trim();

  // Handle user pressing Enter or Space to commit current word
  const handleWordSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (testState !== 'in_progress') return;

      const trimmed = currentInput.trim();
      if (!trimmed && activeWordCursor >= targetWords.length) return;

      // Record user's word
      const updated = [...typedWords];
      updated[activeWordCursor] = trimmed;
      setTypedWords(updated);
      setCurrentInput('');

      // Move cursor to next word
      const nextIndex = activeWordCursor + 1;
      setActiveWordCursor(nextIndex);

      // If user finished all words in the text, finish test
      if (nextIndex >= targetWords.length) {
        setTestState('completed');
        onStop();
      }
    }
  };

  // Reset/Retake the spelling test
  const handleRetakeTest = () => {
    setTypedWords([]);
    setCurrentInput('');
    setActiveWordCursor(0);
    setTestState('idle');
    wasPlayingRef.current = false;
    onStop();
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 50);
  };

  // Start test and play audio in one click with smooth transition and zero scroll jump
  const handleStartTest = () => {
    setTypedWords([]);
    setCurrentInput('');
    setActiveWordCursor(0);
    setTestState('in_progress');
    wasPlayingRef.current = true;
    onGenerateAndPlay();

    // Smooth scroll cleanly into view without jumping or jitter
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 80);
  };

  // Re-hear a specific word's pronunciation
  const handleAuditionWord = (word: string) => {
    setPlayingSingleWord(word);
    speechEngine.speakSingleWord(word, accent, gender);
    setTimeout(() => setPlayingSingleWord(null), 1200);
  };

  // Calculate results
  const evaluatedResults = targetWords.map((target, idx) => {
    const userSpelling = typedWords[idx] || '';
    const cleanTarget = cleanForComparison(target);
    const cleanUser = cleanForComparison(userSpelling);
    const hasAttempted = idx < typedWords.length && userSpelling.length > 0;
    const isCorrect = hasAttempted && cleanTarget === cleanUser;

    return {
      index: idx,
      targetWord: target,
      typedWord: userSpelling,
      isCorrect,
      status: !hasAttempted ? ('missed' as const) : isCorrect ? ('correct' as const) : ('incorrect' as const),
    };
  });

  const correctCount = evaluatedResults.filter((r) => r.isCorrect).length;
  const incorrectCount = evaluatedResults.filter((r) => r.status === 'incorrect').length;
  const missedCount = evaluatedResults.filter((r) => r.status === 'missed').length;
  const totalCount = targetWords.length;
  const scorePercent = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <section
      ref={sectionRef}
      id="spelling-test-section"
      className="bg-white rounded-2xl border-2 border-stone-200 p-5 shadow-xs transition-all space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              testState === 'in_progress'
                ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                : 'bg-stone-900 text-white'
            }`}
          >
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Spelling Test &amp; Dictation Practice
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                {targetWords.length} Words to Test
              </span>
              {testState === 'completed' && (
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    scorePercent >= 80
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : scorePercent >= 50
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-red-100 text-red-900 border-red-300'
                  }`}
                >
                  Score: {scorePercent}%
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              অডিও শুনে বানান লিখুন • Listen to the voice, type each word, and press Enter
            </p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2">
          {testState !== 'in_progress' ? (
            <button
              type="button"
              onClick={handleStartTest}
              disabled={targetWords.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Start Spelling Test</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onStop();
                setTestState('completed');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Finish Test Now</span>
            </button>
          )}

          {testState === 'completed' && (
            <button
              type="button"
              onClick={handleRetakeTest}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs border border-stone-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Helpful Hint / Instructions Notice */}
      <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-700">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>কীভাবে কাজ করে:</strong> অডিও বাজানোর সময় যে শব্দটি শুনবেন, সেটি নিচের বক্সে লিখে{' '}
            <kbd className="px-1.5 py-0.5 bg-white border border-stone-300 rounded text-[11px] font-mono font-semibold text-stone-900 shadow-2xs">
              Enter
            </kbd>{' '}
            চাপুন। অডিও শেষ হওয়া মাত্রই লেখার বক্স স্বয়ংক্রিয়ভাবে বন্ধ হয়ে যাবে এবং লাল-সবুজ মার্ক দিয়ে ফলাফল প্রদর্শিত হবে।
          </p>
        </div>

        {!isWordTimeoutActive && (
          <div className="shrink-0 flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>টিপস: আরামসে লেখার জন্য ওপরের <strong>Word Timeout</strong> অন করুন!</span>
          </div>
        )}
      </div>

      {/* Active Dictation Input Box */}
      <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-800">
              {testState === 'completed'
                ? '🔒 Audio Finished — Input Locked'
                : testState === 'in_progress'
                ? `✍️ Listening & Typing Word #${activeWordCursor + 1} of ${totalCount}`
                : 'Ready to Begin Spelling Test'}
            </span>
            {isAudioActive && (
              <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
                Audio Playing ({accent === 'british' ? '🇬🇧 British' : '🇦🇺 Australian'})
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-stone-500">
            Progress: {typedWords.filter(Boolean).length}/{totalCount} Words Typed
          </span>
        </div>

        {/* The Text Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleWordSubmit}
            disabled={testState === 'completed'}
            placeholder={
              testState === 'completed'
                ? 'Test finished! View your Green & Red spelling results below.'
                : testState === 'in_progress'
                ? `Type word #${activeWordCursor + 1} and press ENTER...`
                : 'Click "Start Spelling Test" or "Play Voice" to begin...'
            }
            className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all shadow-inner focus:outline-none ${
              testState === 'completed'
                ? 'bg-stone-100 text-stone-500 border-stone-300 cursor-not-allowed'
                : testState === 'in_progress'
                ? 'bg-white text-stone-900 border-amber-400 ring-2 ring-amber-100 focus:border-amber-500'
                : 'bg-white text-stone-800 border-stone-300 focus:border-stone-500'
            }`}
          />

          {testState === 'in_progress' && (
            <button
              type="button"
              onClick={() => {
                if (!currentInput.trim()) return;
                const updated = [...typedWords];
                updated[activeWordCursor] = currentInput.trim();
                setTypedWords(updated);
                setCurrentInput('');
                const nextIndex = activeWordCursor + 1;
                setActiveWordCursor(nextIndex);
                if (nextIndex >= targetWords.length) {
                  setTestState('completed');
                  onStop();
                }
              }}
              disabled={!currentInput.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-stone-950 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Submit</span>
              <kbd className="text-[10px] bg-amber-500/30 px-1 py-0.2 rounded font-mono">↵</kbd>
            </button>
          )}
        </div>

        {/* Live Word Slots (Pills showing progress as you type) */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {targetWords.map((_, idx) => {
            const isTyped = idx < typedWords.length && typedWords[idx];
            const isCurrent = idx === activeWordCursor && testState === 'in_progress';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (testState === 'in_progress') {
                    setActiveWordCursor(idx);
                    inputRef.current?.focus({ preventScroll: true });
                  }
                }}
                disabled={testState !== 'in_progress'}
                title={testState === 'in_progress' ? `Click to jump to word #${idx + 1}` : undefined}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-colors text-left cursor-pointer disabled:cursor-default ${
                  isCurrent
                    ? 'bg-amber-100 text-amber-950 border-amber-500 font-bold ring-2 ring-amber-300'
                    : isTyped
                    ? 'bg-white text-stone-800 border-stone-300 font-medium hover:border-stone-400'
                    : 'bg-stone-100 text-stone-400 border-dashed border-stone-300 hover:bg-stone-200/60'
                }`}
              >
                #{idx + 1} {isTyped ? typedWords[idx] : `Word ${idx + 1}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* RESULTS DISPLAY: Green and Red mark breakdown */}
      {testState === 'completed' && (
        <div className="bg-white rounded-xl border-2 border-stone-200 p-4 space-y-4 shadow-sm animate-fade-in">
          {/* Scoreboard Banner */}
          <div className="bg-stone-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                  scorePercent >= 80
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/30'
                    : scorePercent >= 50
                    ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-400/30'
                    : 'bg-red-500 text-white ring-4 ring-red-400/30'
                }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">
                    Spelling Test Results: {scorePercent}% Accuracy
                  </h3>
                </div>
                <p className="text-xs text-stone-300 mt-0.5">
                  Audio playback concluded. Here is the automated word-by-word spelling evaluation:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="bg-emerald-950/80 border border-emerald-500/50 px-3 py-1.5 rounded-lg text-center">
                <div className="text-emerald-400 font-bold text-sm">{correctCount}</div>
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">Correct (Green)</div>
              </div>
              <div className="bg-red-950/80 border border-red-500/50 px-3 py-1.5 rounded-lg text-center">
                <div className="text-red-400 font-bold text-sm">{incorrectCount}</div>
                <div className="text-[10px] text-red-300 uppercase font-semibold">Wrong (Red)</div>
              </div>
              {missedCount > 0 && (
                <div className="bg-stone-800 border border-stone-600 px-3 py-1.5 rounded-lg text-center">
                  <div className="text-amber-400 font-bold text-sm">{missedCount}</div>
                  <div className="text-[10px] text-stone-300 uppercase font-semibold">Missed</div>
                </div>
              )}
            </div>
          </div>

          {/* Word-by-word Red & Green Mark Cards Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Word-by-Word Evaluation &amp; Pronunciation Verification:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {evaluatedResults.map((res) => {
                const isCorrect = res.status === 'correct';
                const isMissed = res.status === 'missed';

                return (
                  <div
                    key={res.index}
                    className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      isCorrect
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                        : isMissed
                        ? 'bg-stone-50 border-stone-300 text-stone-700'
                        : 'bg-red-50/80 border-red-300 text-red-950 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top status indicator */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/80 border border-stone-200 text-stone-700">
                          #{res.index + 1}
                        </span>

                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Correct
                          </span>
                        ) : isMissed ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-stone-600 bg-stone-200 px-2 py-0.5 rounded-full border border-stone-300">
                            <AlertCircle className="w-3 h-3 text-stone-500" />
                            Missed (Time Out)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100/90 px-2 py-0.5 rounded-full border border-red-300">
                            <X className="w-3 h-3 text-red-600" />
                            Incorrect
                          </span>
                        )}
                      </div>

                      {/* Correct Word vs Typed Word */}
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-stone-500 text-[11px]">Correct Word: </span>
                          <span className="font-bold text-stone-900 font-mono text-sm">
                            {res.targetWord}
                          </span>
                        </div>

                        <div className="text-xs">
                          <span className="text-stone-500 text-[11px]">You wrote: </span>
                          <span
                            className={`font-mono font-semibold ${
                              isCorrect
                                ? 'text-emerald-800'
                                : isMissed
                                ? 'text-stone-400 italic'
                                : 'text-red-700 line-through decoration-red-400'
                            }`}
                          >
                            {res.typedWord ? res.typedWord : '(No input entered)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Audio Listen Word button */}
                    <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-stone-500 capitalize">
                        {accent} Voice
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAuditionWord(res.targetWord)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          playingSingleWord === res.targetWord
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300'
                        }`}
                        title={`Listen to "${res.targetWord}" in ${accent} pronunciation`}
                      >
                        <Volume2 className="w-3 h-3 text-amber-600" />
                        <span>Listen</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
