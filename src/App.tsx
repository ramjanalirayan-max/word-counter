import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Accent, Gender, PlaybackStatus, WordPauseSettings, AudioExportFormat, WordToken, UserProfile } from './types';
import { Header } from './components/Header';
import { AccentSection } from './components/AccentSection';
import { AccentDiagnosticAndTester } from './components/AccentDiagnosticAndTester';
import { VoiceArtistSection } from './components/VoiceArtistSection';
import { TextSection } from './components/TextSection';
import { WordCountFeature } from './components/WordCountFeature';
import { SpellingTestSection } from './components/SpellingTestSection';
import { GenerationControls } from './components/GenerationControls';
import { ExportSection } from './components/ExportSection';
import { ContactAdminSection } from './components/ContactAdminSection';
import { StickyFloatingPlayer } from './components/StickyFloatingPlayer';
import { AuthModal } from './components/AuthModal';
import { AdminModal } from './components/AdminModal';
import { authClient, AdminSession } from './utils/authClient';
import { speechEngine } from './utils/speechEngine';
import { tokenizeText, calculateTextStats } from './utils/textTokenizer';
import { audioBufferToMp3, audioBufferToWav, downloadAudioFile } from './utils/audioEncoder';
import { VOICE_ARTISTS } from './data/voices';
import { Command, LogIn, Sparkles } from 'lucide-react';

const INITIAL_TEXT =
  "Welcome to the voice studio. Notice how each word is articulated with distinct accent characteristics and natural timing.";

export default function App() {
  // Authentication & Admin State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authClient.getCurrentUser());
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => authClient.getAdminSession());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  const [accent, setAccent] = useState<Accent>('british');
  const [gender, setGender] = useState<Gender>('female');
  const [text, setText] = useState<string>(INITIAL_TEXT);

  // Speed and Pitch modulation
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  // Accent Realism Boost (phonetic enhancement engine)
  const [phoneticBoost, setPhoneticBoost] = useState<boolean>(true);

  // Word Count & Pause timeout settings (The special requested feature)
  const [pauseSettings, setPauseSettings] = useState<WordPauseSettings>({
    enabled: false,
    pauseDurationMs: 600, // default 0.6s timeout pause
    minPauseMs: 100,
    maxPauseMs: 3500,
  });

  // Playback state
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const [currentWordCount, setCurrentWordCount] = useState<number>(0);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastGeneratedAudioUrl, setLastGeneratedAudioUrl] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tokenize text into words
  const tokens = useMemo(() => tokenizeText(text), [text]);
  const stats = useMemo(
    () => calculateTextStats(text, pauseSettings.pauseDurationMs, pauseSettings.enabled),
    [text, pauseSettings.pauseDurationMs, pauseSettings.enabled]
  );

  // Auto-clear toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3800);
  }, []);

  // Update speech engine modulation parameters whenever speed or pitch changes
  useEffect(() => {
    speechEngine.setVoiceModulation(accent, gender, speed, pitch);
  }, [accent, gender, speed, pitch]);

  // Sync phonetic boost engine
  useEffect(() => {
    speechEngine.setPhoneticBoost(phoneticBoost);
  }, [phoneticBoost]);

  // Sync global volume amplitude
  useEffect(() => {
    speechEngine.setVolume(volume);
  }, [volume]);

  // Record visitor activity when authenticated
  useEffect(() => {
    if (currentUser?.email) {
      authClient.recordVisit(currentUser.email);
    }
  }, [currentUser?.email]);

  // Clean up speech engine on unmount
  useEffect(() => {
    return () => {
      speechEngine.stop();
    };
  }, []);

  // Intercept interactions for unauthenticated guests
  const handleInteractionCapture = (e: React.MouseEvent | React.TouchEvent) => {
    if (currentUser || adminSession) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Detect interactive elements
    const interactive = target.closest('button, input, textarea, select, [role="button"], a');
    if (interactive) {
      e.preventDefault();
      e.stopPropagation();
      setIsAuthModalOpen(true);
    }
  };

  // Playback handlers
  const handleGenerateAndPlay = async () => {
    if (!currentUser && !adminSession) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!text.trim()) {
      showToast('Please enter text to generate voice.');
      return;
    }

    try {
      await speechEngine.speak(text, accent, gender, pauseSettings, {
        onStatusChange: (status) => setPlaybackStatus(status),
        onWordHighlight: (index) => setActiveWordIndex(index),
        onProgress: (prog, currentIdx) => {
          setProgress(prog);
          setCurrentWordCount(currentIdx);
        },
        onError: (errMsg) => {
          showToast(errMsg);
          setPlaybackStatus('idle');
        },
      });
    } catch (err: any) {
      showToast(err?.message || 'Error generating voice');
      setPlaybackStatus('idle');
    }
  };

  const handlePause = () => {
    speechEngine.pause();
    setPlaybackStatus('paused');
  };

  const handleResume = () => {
    speechEngine.resume();
    setPlaybackStatus('playing');
  };

  const handleStop = () => {
    speechEngine.stop();
    setPlaybackStatus('idle');
    setActiveWordIndex(-1);
    setProgress(0);
    setCurrentWordCount(0);
  };

  // Pronounce a single word on demand (when user clicks word tokens)
  const handlePronounceWord = (word: string) => {
    speechEngine.speakSingleWord(word, accent, gender);
  };

  // Keyboard shortcut listener for smooth power-user interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      // Spacebar: Play / Pause toggle
      if (e.key === ' ' && !isInput) {
        e.preventDefault();
        if (playbackStatus === 'playing') {
          handlePause();
        } else if (playbackStatus === 'paused') {
          handleResume();
        } else {
          handleGenerateAndPlay();
        }
      }

      // Escape key: Stop
      if (e.key === 'Escape') {
        if (playbackStatus !== 'idle') {
          handleStop();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackStatus, text, accent, gender, pauseSettings]);

  // Preview Accent phrase
  const handlePreviewAccent = async (targetAccent: Accent) => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    const sampleText =
      targetAccent === 'british'
        ? "This is the classic British accent, characterized by crisp diction and Received Pronunciation."
        : "G'day! This is the genuine Australian accent, with relaxed intonation and open vowels.";

    try {
      await speechEngine.speak(
        sampleText,
        targetAccent,
        gender,
        { enabled: false, pauseDurationMs: 0, minPauseMs: 100, maxPauseMs: 3000 },
        {
          onStatusChange: () => {},
          onWordHighlight: () => {},
          onProgress: () => {},
          onError: (err) => showToast(err),
        }
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  // Preview Voice Artist
  const handlePreviewArtist = async (targetGender: Gender) => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    const artist = VOICE_ARTISTS[accent][targetGender];

    try {
      await speechEngine.speak(
        artist.samplePhrase,
        accent,
        targetGender,
        { enabled: false, pauseDurationMs: 0, minPauseMs: 100, maxPauseMs: 3000 },
        {
          onStatusChange: () => {},
          onWordHighlight: () => {},
          onProgress: () => {},
          onError: (err) => showToast(err),
        }
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  // Export audio in MP3 / WAV
  const handleExport = async (format: AudioExportFormat, kbps: number = 256) => {
    if (!text.trim()) {
      showToast('Please enter text to export audio.');
      return;
    }

    setIsExporting(true);
    showToast(`Rendering ${format.toUpperCase()} audio at high resolution...`);

    try {
      let audioBlob: Blob | null = null;
      let usedEngine = 'client';

      // 1. Try server-side Gemini TTS if accessible
      try {
        const response = await fetch('/api/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            accent,
            gender,
            speed,
            pitch,
            pauseSettings,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.audioBase64) {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
              sampleRate: 24000,
            });
            const binary = window.atob(data.audioBase64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
            const geminiBuffer = audioCtx.createBuffer(1, int16.length, 24000);
            const channel = geminiBuffer.getChannelData(0);
            for (let i = 0; i < int16.length; i++) channel[i] = int16[i] / 32768.0;

            if (format === 'mp3') {
              audioBlob = audioBufferToMp3(geminiBuffer, kbps);
            } else {
              audioBlob = audioBufferToWav(geminiBuffer);
            }
            usedEngine = 'gemini';
          }
        }
      } catch (e) {
        // Fallback to high-definition client synthesizer
      }

      // 2. High-Definition Client Audio Synthesizer fallback if Gemini API is offline/unconfigured
      if (!audioBlob) {
        const renderedBuffer = await speechEngine.renderAudioBuffer(
          text,
          accent,
          gender,
          pauseSettings
        );

        if (format === 'mp3') {
          audioBlob = audioBufferToMp3(renderedBuffer, kbps);
        } else {
          audioBlob = audioBufferToWav(renderedBuffer);
        }
      }

      if (audioBlob) {
        const url = URL.createObjectURL(audioBlob);
        setLastGeneratedAudioUrl(url);

        const safeFilename = `speech_${accent}_${gender}_${pauseSettings.enabled ? 'paced_' : ''}${Date.now()}.${format}`;
        downloadAudioFile(audioBlob, safeFilename);

        showToast(
          `Successfully exported ${format.toUpperCase()} audio (${usedEngine === 'gemini' ? 'Gemini AI Studio' : 'High-Definition Audio Engine'})!`
        );
      }
    } catch (err: any) {
      console.error('Export error:', err);
      showToast(`Failed to export audio: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    handleStop();
    setText(INITIAL_TEXT);
    setAccent('british');
    setGender('female');
    setSpeed(1.0);
    setPitch(1.0);
    setPauseSettings({
      enabled: false,
      pauseDurationMs: 600,
      minPauseMs: 100,
      maxPauseMs: 3500,
    });
    showToast('Reset to default studio settings.');
  };

  const currentWordText =
    activeWordIndex >= 0 && activeWordIndex < tokens.length
      ? tokens[activeWordIndex].cleanWord
      : undefined;

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 font-sans flex flex-col selection:bg-amber-200 pb-20">
      <Header
        onSelectSample={(sampleText, sampleAccent) => {
          if (!currentUser && !adminSession) {
            setIsAuthModalOpen(true);
            return;
          }
          setText(sampleText);
          setAccent(sampleAccent);
        }}
        onReset={handleReset}
        currentUser={currentUser}
        adminSession={adminSession}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogoutUser={() => {
          authClient.logoutUser();
          setCurrentUser(null);
          showToast('Logged out successfully.');
        }}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
      />

      {/* Guest Mode Informational Banner */}
      {!currentUser && !adminSession && (
        <div className="bg-amber-50/95 border-b border-amber-200/90 py-2 px-4 text-center text-xs text-amber-900 flex items-center justify-center gap-2 sticky top-16 z-20 shadow-2xs backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>Guest Mode:</strong> Viewing all features is free. Touch or click any tool to{' '}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="underline font-bold text-amber-950 hover:text-amber-800 cursor-pointer"
            >
              Sign In with Gmail or Email
            </button>{' '}
            and generate speech.
          </span>
        </div>
      )}

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-stone-100 px-4 py-2.5 rounded-xl shadow-xl border border-stone-800 text-xs font-medium flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Container with Interaction Guard */}
      <main
        onClickCapture={handleInteractionCapture}
        onTouchStartCapture={handleInteractionCapture}
        className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5"
      >
        {/* Quick Keyboard Shortcut Helper Badge */}
        <div className="flex items-center justify-between text-[11px] text-stone-700 px-1">
          <div className="flex items-center gap-1.5">
            <Command className="w-3.5 h-3.5 text-stone-400" />
            <span>Shortcuts: Press <kbd className="px-1.5 py-0.5 bg-stone-200 text-stone-800 font-mono rounded text-[10px] font-bold">Space</kbd> to Play/Pause, <kbd className="px-1.5 py-0.5 bg-stone-200 text-stone-800 font-mono rounded text-[10px] font-bold">Esc</kbd> to Stop</span>
          </div>
          <span className="hidden sm:inline text-stone-700">Bengali &amp; English Voice Engine</span>
        </div>

        {/* SECTION 1: Voice Accent */}
        <AccentSection
          selectedAccent={accent}
          onSelectAccent={(newAccent) => {
            setAccent(newAccent);
            handleStop();
          }}
          onPreviewAccent={handlePreviewAccent}
          isPreviewing={isPreviewing}
        />

        {/* SECTION 1.5: Accent Engine Diagnostic & Word-by-Word Audition Tester */}
        <AccentDiagnosticAndTester
          speechEngine={speechEngine}
          selectedAccent={accent}
          selectedGender={gender}
          phoneticBoost={phoneticBoost}
          onTogglePhoneticBoost={(enabled) => {
            setPhoneticBoost(enabled);
            speechEngine.setPhoneticBoost(enabled);
            showToast(
              enabled
                ? 'Accent Realism Boost enabled (Authentic pronunciation active)'
                : 'Accent Realism Boost disabled'
            );
          }}
          onSelectAccent={(newAccent) => {
            setAccent(newAccent);
            handleStop();
          }}
        />

        {/* SECTION 2: Voice Artists (2 dedicated artists: Male & Female) */}
        <VoiceArtistSection
          accent={accent}
          selectedGender={gender}
          onSelectGender={(newGender) => {
            setGender(newGender);
            handleStop();
          }}
          speed={speed}
          onSpeedChange={setSpeed}
          pitch={pitch}
          onPitchChange={setPitch}
          onPreviewArtist={handlePreviewArtist}
          isPreviewing={isPreviewing}
        />

        {/* SECTION 3: Script & Text Input with Word-by-Word Live Highlighting & Click-to-Pronounce */}
        <TextSection
          text={text}
          onChangeText={(newText) => {
            setText(newText);
            if (playbackStatus !== 'idle') handleStop();
          }}
          tokens={tokens}
          activeWordIndex={activeWordIndex}
          playbackStatus={playbackStatus}
          onSelectSample={(sampleText) => {
            setText(sampleText);
            handleStop();
          }}
          onPronounceWord={handlePronounceWord}
        />

        {/* SECTION 4: THE SPECIAL FEATURE - Word Count & Timeout Pacing */}
        {/* Placed directly ABOVE the voice generate controls as requested by user */}
        <WordCountFeature
          wordCount={stats.wordCount}
          charCount={stats.charCount}
          pauseSettings={pauseSettings}
          onChangePauseSettings={(newSettings) => {
            setPauseSettings(newSettings);
            if (playbackStatus !== 'idle') handleStop();
          }}
        />

        {/* SECTION 5: SPELLING TEST & DICTATION PRACTICE */}
        {/* Placed immediately after Word Count & Timeout Pacing as requested */}
        <SpellingTestSection
          tokens={tokens}
          fullText={text}
          playbackStatus={playbackStatus}
          currentWordIndex={activeWordIndex}
          accent={accent}
          gender={gender}
          speechEngine={speechEngine}
          isWordTimeoutActive={pauseSettings.enabled}
          pauseDurationMs={pauseSettings.pauseDurationMs}
          onGenerateAndPlay={handleGenerateAndPlay}
          onStop={handleStop}
        />

        {/* SECTION 6: Voice Generation Controls */}
        <GenerationControls
          playbackStatus={playbackStatus}
          onGenerateAndPlay={handleGenerateAndPlay}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          progress={progress}
          currentWordIndex={currentWordCount}
          totalWords={tokens.length}
          isWordTimeoutActive={pauseSettings.enabled}
          pauseDurationMs={pauseSettings.pauseDurationMs}
          volume={volume}
          onChangeVolume={setVolume}
        />

        {/* SECTION 7: Export & Download in Multiple Formats (MP3, WAV, WebM) */}
        <ExportSection
          isExporting={isExporting}
          onExport={handleExport}
          hasText={text.trim().length > 0}
          accent={accent}
          gender={gender}
          wordCount={tokens.length}
          lastGeneratedAudioUrl={lastGeneratedAudioUrl}
        />
      </main>

      {/* STICKY FLOATING PLAYER DOCK (Smooth user facility movement anywhere on the page) */}
      <div onClickCapture={handleInteractionCapture} onTouchStartCapture={handleInteractionCapture}>
        <StickyFloatingPlayer
          playbackStatus={playbackStatus}
          accent={accent}
          gender={gender}
          progress={progress}
          currentWordIndex={currentWordCount}
          totalWords={tokens.length}
          currentWordText={currentWordText}
          isWordTimeoutActive={pauseSettings.enabled}
          onGenerateAndPlay={handleGenerateAndPlay}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onQuickExportMp3={() => handleExport('mp3', 256)}
          isExporting={isExporting}
          volume={volume}
          onChangeVolume={setVolume}
        />
      </div>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-stone-200 bg-stone-50 py-4 mt-8 text-center text-xs text-stone-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Accent Voice Generator • British &amp; Australian Studio</span>
          <span className="text-stone-400">Word Count Timeout Pacing • MP3 &amp; WAV Audio Export</span>
        </div>
      </footer>

      {/* USER AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome ${user.name || user.email}! Studio features unlocked.`);
        }}
      />

      {/* ADMIN CONTROL PANEL MODAL */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        adminSession={adminSession}
        onAdminLogin={(session) => {
          setAdminSession(session);
          showToast('Welcome Administrator Ramjan Ali!');
        }}
        onAdminLogout={() => {
          authClient.logoutAdmin();
          setAdminSession(null);
          showToast('Admin logged out.');
        }}
      />
    </div>
  );
}
