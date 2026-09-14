import React, { useState } from 'react';
import { Download, FileAudio, Check, Loader2, Music, Sparkles } from 'lucide-react';
import { AudioExportFormat } from '../types';

interface ExportSectionProps {
  isExporting: boolean;
  onExport: (format: AudioExportFormat, kbps: number) => Promise<void>;
  hasText: boolean;
  accent: string;
  gender: string;
  wordCount: number;
  lastGeneratedAudioUrl: string | null;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  isExporting,
  onExport,
  hasText,
  accent,
  gender,
  wordCount,
  lastGeneratedAudioUrl,
}) => {
  const [selectedKbps, setSelectedKbps] = useState<number>(192);
  const [exportingFormat, setExportingFormat] = useState<AudioExportFormat | null>(null);

  const handleDownload = async (format: AudioExportFormat) => {
    if (!hasText || isExporting) return;
    setExportingFormat(format);
    try {
      await onExport(format, selectedKbps);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">Export &amp; Download Audio</h2>
            <p className="text-xs text-stone-700">Download speech in multiple high-quality studio audio formats</p>
          </div>
        </div>

        {/* Quality selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-600 font-medium">Quality:</span>
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            {[128, 192, 320].map((kbps) => (
              <button
                key={kbps}
                type="button"
                onClick={() => setSelectedKbps(kbps)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                  selectedKbps === kbps
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {kbps}k
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Format Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* MP3 Format Button (Primary requested format) */}
        <div className="rounded-xl border-2 border-stone-900 bg-stone-900 text-white p-4 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-amber-400/10 rounded-full blur-xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-stone-950 uppercase tracking-wider">
                Recommended
              </span>
              <FileAudio className="w-4 h-4 text-stone-400" />
            </div>

            <h3 className="font-bold text-base mt-2 tracking-tight flex items-center gap-1.5">
              MP3 Audio
            </h3>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              Standard format for podcasts, video voiceovers, and mobile playback.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-800">
            <button
              type="button"
              id="download-mp3-button"
              disabled={!hasText || isExporting}
              onClick={() => handleDownload('mp3')}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {exportingFormat === 'mp3' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Encoding MP3...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP3</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* WAV Format Button (Lossless Studio format) */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 uppercase tracking-wider">
                Uncompressed
              </span>
              <Music className="w-4 h-4 text-stone-400" />
            </div>

            <h3 className="font-bold text-base mt-2 text-stone-900 tracking-tight">
              WAV Studio Master
            </h3>
            <p className="text-xs text-stone-700 mt-1 leading-relaxed">
              Lossless 44.1 kHz PCM master audio for professional audio editing &amp; DAW mastering.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200">
            <button
              type="button"
              id="download-wav-button"
              disabled={!hasText || isExporting}
              onClick={() => handleDownload('wav')}
              className="w-full py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {exportingFormat === 'wav' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating WAV...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download WAV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* WebM Format Button (Web-native stream) */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 flex flex-col justify-between hover:border-stone-300 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-700 uppercase tracking-wider">
                Web Stream
              </span>
              <Sparkles className="w-4 h-4 text-stone-400" />
            </div>

            <h3 className="font-bold text-base mt-2 text-stone-900 tracking-tight">
              WebM Audio
            </h3>
            <p className="text-xs text-stone-700 mt-1 leading-relaxed">
              Compact browser container format optimized for online streaming and web applications.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200">
            <button
              type="button"
              id="download-webm-button"
              disabled={!hasText || isExporting}
              onClick={() => handleDownload('webm')}
              className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed text-stone-800 font-semibold text-xs border border-stone-300 flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              {exportingFormat === 'webm' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Exporting WebM...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download WebM</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Audio player preview if an export was generated */}
      {lastGeneratedAudioUrl && (
        <div className="mt-4 p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-900 flex items-center justify-center font-bold">
              <Check className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-900">Audio Ready for Playback</p>
              <p className="text-[11px] text-stone-700">
                Rendered with {accent.toUpperCase()} accent ({gender}) • {wordCount} words
              </p>
            </div>
          </div>

          <audio
            controls
            src={lastGeneratedAudioUrl}
            className="w-full sm:w-64 h-8"
          />
        </div>
      )}
    </section>
  );
};
