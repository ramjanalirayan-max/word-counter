import React, { useState } from 'react';
import { PlaybackStatus, Accent, Gender } from '../types';
import { Play, Pause, Square, Download, Volume2, Volume1, VolumeX } from 'lucide-react';
import { VOICE_ARTISTS } from '../data/voices';

interface StickyFloatingPlayerProps {
  playbackStatus: PlaybackStatus;
  accent: Accent;
  gender: Gender;
  progress: number;
  currentWordIndex: number;
  totalWords: number;
  currentWordText?: string;
  isWordTimeoutActive: boolean;
  onGenerateAndPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onQuickExportMp3: () => void;
  isExporting: boolean;
  volume: number;
  onChangeVolume: (volume: number) => void;
}

export const StickyFloatingPlayer: React.FC<StickyFloatingPlayerProps> = ({
  playbackStatus,
  accent,
  gender,
  progress,
  currentWordIndex,
  totalWords,
  currentWordText,
  isWordTimeoutActive,
  onGenerateAndPlay,
  onPause,
  onResume,
  onStop,
  onQuickExportMp3,
  isExporting,
  volume,
  onChangeVolume,
}) => {
  const [previousVolume, setPreviousVolume] = useState<number>(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const isPlaying = playbackStatus === 'playing';
  const isPaused = playbackStatus === 'paused';
  const isGenerating = playbackStatus === 'generating';
  const isActive = isPlaying || isPaused || isGenerating;
  const artist = VOICE_ARTISTS[accent][gender];

  const handleToggleMute = () => {
    if (volume > 0) {
      setPreviousVolume(volume);
      onChangeVolume(0);
    } else {
      onChangeVolume(previousVolume > 0 ? previousVolume : 1.0);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="w-3.5 h-3.5 text-stone-400" />;
    if (volume < 0.5) return <Volume1 className="w-3.5 h-3.5 text-amber-400" />;
    return <Volume2 className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <aside aria-label="Floating Audio Controls" className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-[94%] max-w-2xl">
      <div className="bg-stone-900/95 backdrop-blur-md text-white rounded-2xl p-3 sm:px-4 sm:py-3 shadow-2xl border border-stone-700/80 flex items-center justify-between gap-3 transition-all">
        {/* Left: Active Artist and Live Word */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                isPlaying
                  ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300'
                  : 'bg-stone-800 text-stone-200'
              }`}
            >
              {isPlaying ? (
                <Volume2 className="w-5 h-5 animate-pulse" />
              ) : (
                <span>{accent === 'british' ? '🇬🇧' : '🇦🇺'}</span>
              )}
            </div>
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold text-stone-100 truncate">
                {artist.name} ({gender === 'male' ? 'Male' : 'Female'})
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 capitalize">
                {accent}
              </span>
              {isWordTimeoutActive && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300">
                  Paced
                </span>
              )}
            </div>

            <div className="text-[11px] text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
              {isActive ? (
                <>
                  <span className="font-mono text-amber-300 font-semibold">
                    Word {currentWordIndex}/{totalWords}
                  </span>
                  {currentWordText && (
                    <span className="text-stone-300 truncate">
                      • &quot;{currentWordText}&quot;
                    </span>
                  )}
                </>
              ) : (
                <span>Ready to synthesize voice</span>
              )}
            </div>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Volume Control Button & Mini Slider */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              title={`Volume: ${Math.round(volume * 100)}% (Click to toggle slider)`}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs border border-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {getVolumeIcon()}
              <span className="text-[10px] font-mono hidden sm:inline text-stone-300">
                {Math.round(volume * 100)}%
              </span>
            </button>

            {/* Popover slider on click or on desktop hover */}
            {showVolumeSlider && (
              <div className="absolute bottom-full mb-2 right-0 bg-stone-900 border border-stone-700 rounded-xl p-3 shadow-xl flex items-center gap-2.5 z-50 w-48">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="text-stone-300 hover:text-white"
                  title={volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {getVolumeIcon()}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  aria-label="Floating player volume slider"
                />
                <span className="text-[11px] font-mono font-bold text-amber-400 min-w-7 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Main Playback toggle */}
          {!isActive ? (
            <button
              type="button"
              onClick={onGenerateAndPlay}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Play Voice</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {isPlaying ? (
                <button
                  type="button"
                  onClick={onPause}
                  title="Pause playback"
                  className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs border border-stone-700 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onResume}
                  title="Resume playback"
                  className="p-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs shadow-xs transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}

              <button
                type="button"
                onClick={onStop}
                title="Stop playback"
                className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 text-xs border border-red-800/60 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          )}

          {/* Quick Export MP3 button right in bottom dock */}
          <button
            type="button"
            onClick={onQuickExportMp3}
            disabled={isExporting}
            title="Download MP3 directly"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 hover:text-white text-xs font-semibold border border-stone-700 transition-colors active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Quick MP3</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
