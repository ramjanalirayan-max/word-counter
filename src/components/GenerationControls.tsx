import React, { useState } from 'react';
import { PlaybackStatus } from '../types';
import { Play, Pause, Square, Sparkles, Volume2, Volume1, VolumeX } from 'lucide-react';

interface GenerationControlsProps {
  playbackStatus: PlaybackStatus;
  onGenerateAndPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  progress: number;
  currentWordIndex: number;
  totalWords: number;
  isWordTimeoutActive: boolean;
  pauseDurationMs: number;
  volume: number;
  onChangeVolume: (volume: number) => void;
}

export const GenerationControls: React.FC<GenerationControlsProps> = ({
  playbackStatus,
  onGenerateAndPlay,
  onPause,
  onResume,
  onStop,
  progress,
  currentWordIndex,
  totalWords,
  isWordTimeoutActive,
  pauseDurationMs,
  volume,
  onChangeVolume,
}) => {
  const [previousVolume, setPreviousVolume] = useState<number>(1.0);
  const isPlaying = playbackStatus === 'playing';
  const isPaused = playbackStatus === 'paused';
  const isGenerating = playbackStatus === 'generating';
  const isActive = isPlaying || isPaused || isGenerating;

  const handleToggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      onChangeVolume(0);
    } else {
      onChangeVolume(previousVolume > 0 ? previousVolume : 1.0);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-4 h-4 text-stone-400" />;
    if (volume < 0.5) return <Volume1 className="w-4 h-4 text-amber-600" />;
    return <Volume2 className="w-4 h-4 text-amber-600" />;
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Left Status & Waveform */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-100'
                : 'bg-stone-900 text-white'
            }`}
          >
            {isPlaying ? (
              <Volume2 className="w-6 h-6 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-300" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                {isGenerating && 'Generating Audio Stream...'}
                {isPlaying && 'Synthesizing & Playing Speech...'}
                {isPaused && 'Playback Paused'}
                {!isActive && 'Voice Ready for Generation'}
              </h3>
              {isPlaying && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              {isWordTimeoutActive ? (
                <>
                  Paced Mode: <span className="font-semibold text-stone-900">{(pauseDurationMs / 1000).toFixed(1)}s timeout</span> between words
                </>
              ) : (
                'Standard natural speech flow with live boundary tracking'
              )}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          {!isActive ? (
            <button
              type="button"
              id="generate-voice-button"
              onClick={onGenerateAndPlay}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-sm hover:shadow transition-all cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Generate &amp; Play Voice</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isPlaying ? (
                <button
                  type="button"
                  onClick={onPause}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs border border-stone-200 transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onResume}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              )}

              <button
                type="button"
                onClick={onStop}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Volume Amplitude Slider Bar */}
      <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-700 cursor-pointer"
            title={volume === 0 ? 'Unmute audio' : 'Mute audio'}
          >
            {getVolumeIcon()}
          </button>
          <span className="font-semibold text-stone-700 text-xs">Global Output Amplitude:</span>
          <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-[11px] border border-stone-200">
            {Math.round(volume * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-64">
          <span className="text-[11px] text-stone-400 font-medium">0%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
            aria-label="Global volume output slider"
          />
          <span className="text-[11px] text-stone-700 font-medium">100%</span>
        </div>
      </div>

      {/* Progress Bar when active */}
      {isActive && (
        <div className="pt-3 border-t border-stone-200/80 space-y-1.5">
          <div className="flex justify-between text-xs text-stone-600 font-mono">
            <span>
              Word {currentWordIndex} of {totalWords}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">
            <div
              className="h-full bg-amber-400 transition-all duration-200 ease-out rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
