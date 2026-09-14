import React from 'react';
import { Accent } from '../types';
import { Globe, Check, Volume2 } from 'lucide-react';

interface AccentSectionProps {
  selectedAccent: Accent;
  onSelectAccent: (accent: Accent) => void;
  onPreviewAccent: (accent: Accent) => void;
  isPreviewing: boolean;
}

export const AccentSection: React.FC<AccentSectionProps> = ({
  selectedAccent,
  onSelectAccent,
  onPreviewAccent,
  isPreviewing,
}) => {
  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">Voice Accent</h2>
            <p className="text-xs text-stone-700">Choose between authentic British or Australian pronunciation</p>
          </div>
        </div>

        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
          2 Regional Accents
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* British Accent Card */}
        <div
          onClick={() => onSelectAccent('british')}
          className={`relative rounded-xl p-4 cursor-pointer transition-all border text-left ${
            selectedAccent === 'british'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-stone-50/60 text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-100/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" role="img" aria-label="United Kingdom Flag">
                🇬🇧
              </span>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  British Accent
                  {selectedAccent === 'british' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </h3>
                <p className={`text-xs ${selectedAccent === 'british' ? 'text-stone-300' : 'text-stone-500'}`}>
                  Received Pronunciation (RP) & Standard UK
                </p>
              </div>
            </div>

            {selectedAccent === 'british' ? (
              <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-stone-300" />
            )}
          </div>

          <p className={`text-xs mt-3 leading-relaxed ${selectedAccent === 'british' ? 'text-stone-300' : 'text-stone-600'}`}>
            Crisp articulation, non-rhotic vowels, refined cadence, and clear consonant finishes.
          </p>

          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[11px]">
            <span className={selectedAccent === 'british' ? 'text-stone-400' : 'text-stone-500'}>
              Lang code: <strong className="font-mono">en-GB</strong>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewAccent('british');
              }}
              disabled={isPreviewing}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                selectedAccent === 'british'
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              <Volume2 className="w-3 h-3 text-amber-500" />
              <span>Sample Accent</span>
            </button>
          </div>
        </div>

        {/* Australian Accent Card */}
        <div
          onClick={() => onSelectAccent('australian')}
          className={`relative rounded-xl p-4 cursor-pointer transition-all border text-left ${
            selectedAccent === 'australian'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-stone-50/60 text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-100/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" role="img" aria-label="Australia Flag">
                🇦🇺
              </span>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                  Australian Accent
                  {selectedAccent === 'australian' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </h3>
                <p className={`text-xs ${selectedAccent === 'australian' ? 'text-stone-300' : 'text-stone-500'}`}>
                  General Australian & Strine Phonetics
                </p>
              </div>
            </div>

            {selectedAccent === 'australian' ? (
              <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border border-stone-300" />
            )}
          </div>

          <p className={`text-xs mt-3 leading-relaxed ${selectedAccent === 'australian' ? 'text-stone-300' : 'text-stone-600'}`}>
            Warm intonation, broad open diphthongs, characteristic vowel shifts, and friendly rhythm.
          </p>

          <div className="mt-3.5 pt-3 border-t flex items-center justify-between text-[11px]">
            <span className={selectedAccent === 'australian' ? 'text-stone-400' : 'text-stone-500'}>
              Lang code: <strong className="font-mono">en-AU</strong>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewAccent('australian');
              }}
              disabled={isPreviewing}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                selectedAccent === 'australian'
                  ? 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                  : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
              }`}
            >
              <Volume2 className="w-3 h-3 text-amber-500" />
              <span>Sample Accent</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
