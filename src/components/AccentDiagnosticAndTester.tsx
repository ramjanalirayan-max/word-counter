import React, { useState, useEffect } from 'react';
import { Accent, Gender, DetectedVoiceInfo } from '../types';
import { AccentSpeechEngine } from '../utils/speechEngine';
import { ACCENT_BENCHMARKS } from '../utils/accentPhonetics';
import { Sparkles, Volume2, CheckCircle2, AlertCircle, Headphones, SlidersHorizontal } from 'lucide-react';

interface AccentDiagnosticAndTesterProps {
  speechEngine: AccentSpeechEngine;
  selectedAccent: Accent;
  selectedGender: Gender;
  phoneticBoost: boolean;
  onTogglePhoneticBoost: (enabled: boolean) => void;
  onSelectAccent: (accent: Accent) => void;
}

export const AccentDiagnosticAndTester: React.FC<AccentDiagnosticAndTesterProps> = ({
  speechEngine,
  selectedAccent,
  selectedGender,
  phoneticBoost,
  onTogglePhoneticBoost,
  onSelectAccent,
}) => {
  const [diagnostic, setDiagnostic] = useState<DetectedVoiceInfo | null>(null);
  const [accentVoices, setAccentVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Refresh detected voices and diagnostic info
  const refreshDiagnostic = () => {
    const diag = speechEngine.getVoiceDiagnostic(selectedAccent, selectedGender);
    setDiagnostic(diag);
    const voices = speechEngine.getVoicesForAccent(selectedAccent);
    setAccentVoices(voices);
    setSelectedVoiceURI(speechEngine.getSelectedVoice() || diag.voiceURI || '');
  };

  useEffect(() => {
    refreshDiagnostic();
    const interval = setInterval(refreshDiagnostic, 1200);
    return () => clearInterval(interval);
  }, [selectedAccent, selectedGender, speechEngine]);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedVoiceURI(val);
    speechEngine.setSelectedVoice(val === 'auto' ? null : val);
    refreshDiagnostic();
  };

  const handleTestWord = (word: string, targetAccent: Accent, benchmarkId: string) => {
    setPlayingWordId(`${benchmarkId}-${targetAccent}`);
    speechEngine.speakSingleWord(word, targetAccent, selectedGender);
    setTimeout(() => {
      setPlayingWordId(null);
    }, 1200);
  };

  return (
    <section className="bg-stone-50/80 rounded-2xl border border-stone-200 p-5 shadow-xs transition-all">
      {/* Header with Title and Realism Boost Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                Accent Calibration &amp; Pronunciation Engine
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Active &amp; Calibrated
              </span>
            </div>
            <p className="text-xs text-stone-600">
              Phonetic tuning ensures authentic British (RP) and Australian cadences across all browsers
            </p>
          </div>
        </div>

        {/* Phonetic Boost Toggle Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-semibold text-stone-800 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            Accent Realism Boost:
          </span>
          <button
            type="button"
            onClick={() => onTogglePhoneticBoost(!phoneticBoost)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              phoneticBoost ? 'bg-amber-500' : 'bg-stone-300'
            }`}
            title="Toggle phonetic pronunciation adaptation for authentic non-rhotic vowels and diphthongs"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                phoneticBoost ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
          <span
            className={`text-[11px] font-bold ${
              phoneticBoost ? 'text-amber-700' : 'text-stone-400'
            }`}
          >
            {phoneticBoost ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Voice Status Diagnostic Ribbon */}
      <div className="bg-white rounded-xl border border-stone-200 p-3.5 mb-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            {diagnostic?.isNative ? (
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-stone-900">
                  {selectedAccent === 'australian' ? '🇦🇺 Australian' : '🇬🇧 British'} Audio Engine:
                </span>
                <span className="font-mono text-[11px] text-stone-700 font-medium bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  {diagnostic?.name || 'Loading system voice...'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {diagnostic?.isNative
                  ? 'Native regional voice package installed on your device.'
                  : 'Adaptive Phonetic Engine is actively synthesizing authentic regional phonemes.'}
              </p>
            </div>
          </div>

          {/* Voice Selector Dropdown (if multiple voices exist) */}
          {accentVoices.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label className="text-stone-500 text-[11px] font-medium shrink-0">Installed Voice:</label>
              <select
                value={selectedVoiceURI}
                onChange={handleVoiceChange}
                className="text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-400"
              >
                <option value="auto">Auto-Matched (Recommended)</option>
                {accentVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Side-by-Side Accent Comparison Tester */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Headphones className="w-4 h-4 text-stone-700" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Instant Accent Comparison &amp; Word Audition
            </h3>
          </div>
          <span className="text-[11px] text-stone-700">
            Click British or Australian button to audition the pronunciation difference:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {ACCENT_BENCHMARKS.map((bench) => {
            const isPlayingBritish = playingWordId === `${bench.id}-british`;
            const isPlayingAustralian = playingWordId === `${bench.id}-australian`;

            return (
              <div
                key={bench.id}
                className="bg-white rounded-xl border border-stone-200/90 p-3 flex flex-col justify-between hover:border-stone-300 transition-all shadow-2xs"
              >
                <div>
                  <div className="font-bold text-sm text-stone-900 tracking-tight">
                    {bench.word}
                  </div>
                  <div className="text-[11px] text-stone-700 mt-0.5 leading-tight">
                    🇬🇧 <span className="font-semibold text-stone-800">{bench.britishPhonetic}</span>
                    <span className="mx-1 text-stone-300">|</span>
                    🇦🇺 <span className="font-semibold text-stone-800">{bench.australianPhonetic}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2.5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAccent('british');
                      handleTestWord(bench.word, 'british', bench.id);
                    }}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isPlayingBritish
                        ? 'bg-stone-900 text-white shadow-xs'
                        : selectedAccent === 'british'
                        ? 'bg-amber-100/70 text-amber-900 border border-amber-300/80 hover:bg-amber-200/80'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                    title={`Audition "${bench.word}" in British English: ${bench.britishDescription}`}
                  >
                    <Volume2 className="w-3 h-3 text-amber-600" />
                    <span>🇬🇧 UK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectAccent('australian');
                      handleTestWord(bench.word, 'australian', bench.id);
                    }}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isPlayingAustralian
                        ? 'bg-stone-900 text-white shadow-xs'
                        : selectedAccent === 'australian'
                        ? 'bg-amber-100/70 text-amber-900 border border-amber-300/80 hover:bg-amber-200/80'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                    title={`Audition "${bench.word}" in Australian English: ${bench.australianDescription}`}
                  >
                    <Volume2 className="w-3 h-3 text-amber-600" />
                    <span>🇦🇺 AU</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
