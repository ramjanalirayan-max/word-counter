import React, { useState, useEffect } from 'react';
import { WordPauseSettings } from '../types';
import { Clock, Sliders, Info, CheckCircle2, Activity } from 'lucide-react';
import { formatSeconds } from '../utils/textTokenizer';

interface WordCountFeatureProps {
  wordCount: number;
  charCount: number;
  pauseSettings: WordPauseSettings;
  onChangePauseSettings: (settings: WordPauseSettings) => void;
}

export const WordCountFeature: React.FC<WordCountFeatureProps> = ({
  wordCount,
  charCount,
  pauseSettings,
  onChangePauseSettings,
}) => {
  // Preset timeout intervals in milliseconds
  const timeoutPresets = [
    { label: '0.2s', value: 200, tag: 'Brisk' },
    { label: '0.5s', value: 500, tag: 'Natural' },
    { label: '0.8s', value: 800, tag: 'Dictation' },
    { label: '1.2s', value: 1200, tag: 'Study' },
    { label: '2.0s', value: 2000, tag: 'Drill' },
  ];

  // Visual metronome pulse indicator
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    if (!pauseSettings.enabled) return;
    const interval = setInterval(() => {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 160);
    }, Math.max(300, pauseSettings.pauseDurationMs));

    return () => clearInterval(interval);
  }, [pauseSettings.enabled, pauseSettings.pauseDurationMs]);

  // Calculate timing estimates
  const baseSpeechSec = wordCount * 0.45;
  const totalPauseSec =
    pauseSettings.enabled && wordCount > 1
      ? ((wordCount - 1) * pauseSettings.pauseDurationMs) / 1000
      : 0;
  const totalDurationSec = Math.round(baseSpeechSec + totalPauseSec);

  const toggleFeature = () => {
    onChangePauseSettings({
      ...pauseSettings,
      enabled: !pauseSettings.enabled,
    });
  };

  const handlePauseChange = (newDurationMs: number) => {
    onChangePauseSettings({
      ...pauseSettings,
      pauseDurationMs: Math.max(100, Math.min(3500, newDurationMs)),
    });
  };

  return (
    <section className="bg-white rounded-2xl border-2 border-stone-200 p-5 shadow-xs transition-all">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              pauseSettings.enabled
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'bg-stone-100 text-stone-700'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Word Count &amp; Timeout Pacing
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                {wordCount} {wordCount === 1 ? 'Word' : 'Words'}
              </span>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              শব্দের মাঝের বিরতি নির্ধারণ • Customizable pause duration between consecutive words
            </p>
          </div>
        </div>

        {/* Feature Toggle switch */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <span className="text-xs font-semibold text-stone-700">
            {pauseSettings.enabled ? 'Timeout Active' : 'Enable Word Timeout'}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={pauseSettings.enabled}
            onClick={toggleFeature}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              pauseSettings.enabled ? 'bg-stone-900' : 'bg-stone-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                pauseSettings.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* When Feature is Selected/Enabled: Prompt for Timeout Duration */}
      {pauseSettings.enabled ? (
        <div className="mt-4 pt-1 space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-950">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Word-by-word pause timeout configured (একটি শব্দ বলার পর অন্য শব্দের বিরতি)
              </p>
              <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                The voice generator speaks each word individually, waiting exactly{' '}
                <strong>{(pauseSettings.pauseDurationMs / 1000).toFixed(1)} seconds</strong>{' '}
                before pronouncing the next word.
              </p>
            </div>
          </div>

          {/* Timeout controls */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-stone-600" />
                <span>Word Timeout Duration (Pause between words):</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  max="3.5"
                  step="0.1"
                  value={(pauseSettings.pauseDurationMs / 1000).toFixed(1)}
                  onChange={(e) =>
                    handlePauseChange(Math.round(parseFloat(e.target.value || '0.5') * 1000))
                  }
                  className="w-20 px-2 py-1 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold text-stone-900 text-center focus:outline-stone-900"
                />
                <span className="text-xs font-semibold text-stone-600">
                  seconds ({pauseSettings.pauseDurationMs}ms)
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="100"
                max="3000"
                step="50"
                value={pauseSettings.pauseDurationMs}
                onChange={(e) => handlePauseChange(parseInt(e.target.value, 10))}
                className="w-full accent-stone-900 h-2 bg-stone-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone-600 font-mono">
                <span>0.1s (Fast)</span>
                <span>1.0s (Moderate)</span>
                <span>2.0s (Spacious)</span>
                <span>3.0s (Deep Pause)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="pt-2 border-t border-stone-200/80">
              <span className="text-[11px] font-semibold text-stone-700 block mb-2">
                Recommended Timeout Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {timeoutPresets.map((preset) => {
                  const isActive = pauseSettings.pauseDurationMs === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => handlePauseChange(preset.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-bold">{preset.label}</div>
                      <div className={`text-[10px] ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                        {preset.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Cadence & Metronome Diagram */}
            <div className="bg-white p-3.5 rounded-xl border border-stone-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-700">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold text-[11px] uppercase tracking-wider text-stone-600">
                    Live Cadence Metronome
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-150 ${
                      pulseActive ? 'bg-amber-500 scale-150 ring-4 ring-amber-200' : 'bg-stone-300'
                    }`}
                  />
                </div>
                <span className="font-mono text-stone-600">
                  Estimated Delivery: ~{formatSeconds(totalDurationSec)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto py-1 text-stone-700">
                <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200 font-medium">
                  Word 1
                </span>
                <span className="text-amber-600 font-mono font-bold whitespace-nowrap">
                  ➔ [{(pauseSettings.pauseDurationMs / 1000).toFixed(1)}s timeout] ➔
                </span>
                <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200 font-medium">
                  Word 2
                </span>
                <span className="text-amber-600 font-mono font-bold whitespace-nowrap">
                  ➔ [{(pauseSettings.pauseDurationMs / 1000).toFixed(1)}s timeout] ➔
                </span>
                <span className="px-2 py-0.5 bg-stone-100 rounded border border-stone-200 font-medium">
                  Word 3 ...
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Disabled State Info */
        <div className="mt-3 flex items-center justify-between text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-stone-500" />
            <span>
              Standard natural speech is active (~{formatSeconds(Math.round(baseSpeechSec))}).
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFeature}
            className="text-stone-900 font-semibold hover:underline cursor-pointer"
          >
            Configure Timeout Pacing
          </button>
        </div>
      )}
    </section>
  );
};
