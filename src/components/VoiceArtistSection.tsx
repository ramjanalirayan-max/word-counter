import React from 'react';
import { Accent, Gender } from '../types';
import { VOICE_ARTISTS } from '../data/voices';
import { User, Sliders, Volume2, Check, RotateCcw } from 'lucide-react';

interface VoiceArtistSectionProps {
  accent: Accent;
  selectedGender: Gender;
  onSelectGender: (gender: Gender) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  pitch: number;
  onPitchChange: (pitch: number) => void;
  onPreviewArtist: (gender: Gender) => void;
  isPreviewing: boolean;
}

export const VoiceArtistSection: React.FC<VoiceArtistSectionProps> = ({
  accent,
  selectedGender,
  onSelectGender,
  speed,
  onSpeedChange,
  pitch,
  onPitchChange,
  onPreviewArtist,
  isPreviewing,
}) => {
  const currentArtists = VOICE_ARTISTS[accent];

  const speedPresets = [
    { label: '0.85x', value: 0.85, title: 'Relaxed' },
    { label: '1.0x', value: 1.0, title: 'Natural' },
    { label: '1.2x', value: 1.2, title: 'Brisk' },
  ];

  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">Voice Artists</h2>
            <p className="text-xs text-stone-600">Select between 2 dedicated voice profiles (Male &amp; Female)</p>
          </div>
        </div>

        {/* Gender Toggle Pills */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs self-start sm:self-center">
          <button
            type="button"
            onClick={() => onSelectGender('male')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              selectedGender === 'male'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            👨 Male Voice
          </button>
          <button
            type="button"
            onClick={() => onSelectGender('female')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              selectedGender === 'female'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            👩 Female Voice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Male Artist Card */}
        {(() => {
          const artist = currentArtists.male;
          const isSelected = selectedGender === 'male';
          return (
            <div
              onClick={() => onSelectGender('male')}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border text-left relative active:scale-[0.99] ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-1 ring-stone-900'
                  : 'bg-stone-50/60 text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-100/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border transition-all ${
                      isSelected
                        ? 'bg-stone-800 text-amber-300 border-stone-700'
                        : 'bg-white text-stone-800 border-stone-200 shadow-xs'
                    }`}
                  >
                    👨‍💼
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm tracking-tight">{artist.name}</h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        Male Artist
                      </span>
                    </div>
                    <p className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {artist.title}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-stone-300" />
                )}
              </div>

              <p className={`text-xs mt-3 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                {artist.accentDescription}
              </p>

              <div className="mt-3.5 pt-3 border-t flex items-center justify-between">
                <span className={`text-[11px] ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
                  Accent: <strong className="capitalize text-amber-500 font-semibold">{accent}</strong>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewArtist('male');
                  }}
                  disabled={isPreviewing}
                  className={`text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-xs'
                      : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200 shadow-2xs'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audition Voice</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Female Artist Card */}
        {(() => {
          const artist = currentArtists.female;
          const isSelected = selectedGender === 'female';
          return (
            <div
              onClick={() => onSelectGender('female')}
              className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border text-left relative active:scale-[0.99] ${
                isSelected
                  ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-1 ring-stone-900'
                  : 'bg-stone-50/60 text-stone-800 border-stone-200 hover:border-stone-300 hover:bg-stone-100/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold border transition-all ${
                      isSelected
                        ? 'bg-stone-800 text-amber-300 border-stone-700'
                        : 'bg-white text-stone-800 border-stone-200 shadow-xs'
                    }`}
                  >
                    👩‍💼
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm tracking-tight">{artist.name}</h3>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        Female Artist
                      </span>
                    </div>
                    <p className={`text-xs ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {artist.title}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-stone-300" />
                )}
              </div>

              <p className={`text-xs mt-3 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                {artist.accentDescription}
              </p>

              <div className="mt-3.5 pt-3 border-t flex items-center justify-between">
                <span className={`text-[11px] ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
                  Accent: <strong className="capitalize text-amber-500 font-semibold">{accent}</strong>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewArtist('female');
                  }}
                  disabled={isPreviewing}
                  className={`text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-stone-800 hover:bg-stone-700 text-stone-100 shadow-xs'
                      : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200 shadow-2xs'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Audition Voice</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Vocal Modulation Sliders & Speed Presets */}
      <div className="mt-4 pt-4 border-t border-stone-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-stone-50/70 p-3.5 rounded-xl border border-stone-200/60">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
            <Sliders className="w-3.5 h-3.5 text-stone-600" />
            <span>Voice Modulation</span>
          </div>

          {/* Quick Speed presets */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-stone-200">
            {speedPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onSpeedChange(preset.value)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  Math.abs(speed - preset.value) < 0.05
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-w-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600 min-w-16 font-medium">
              Speed: <strong className="text-stone-900 font-mono">{speed.toFixed(2)}x</strong>
            </span>
            <input
              type="range"
              min="0.6"
              max="1.5"
              step="0.05"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-600 min-w-16 font-medium">
              Pitch: <strong className="text-stone-900 font-mono">{pitch.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.05"
              value={pitch}
              onChange={(e) => onPitchChange(parseFloat(e.target.value))}
              className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
