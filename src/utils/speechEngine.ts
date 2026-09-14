import { Accent, Gender, VoiceArtist, WordPauseSettings, WordToken, DetectedVoiceInfo } from '../types';
import { VOICE_ARTISTS } from '../data/voices';
import { tokenizeText } from './textTokenizer';
import { audioBufferToMp3, audioBufferToWav } from './audioEncoder';
import { adaptWordForAccent, transformTextForAccent } from './accentPhonetics';

export interface SpeechEngineCallbacks {
  onWordHighlight: (wordIndex: number, token: WordToken | null) => void;
  onStatusChange: (status: 'idle' | 'generating' | 'playing' | 'paused' | 'finished') => void;
  onProgress: (progress: number, currentWordIndex: number, totalWords: number) => void;
  onError: (errorMessage: string) => void;
  onAudioReady?: (audioBlob: Blob, format: 'mp3' | 'wav') => void;
}

export class AccentSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private cancelRequested = false;
  private voices: SpeechSynthesisVoice[] = [];
  private activeSequenceTimeout: any = null;
  private keepAliveInterval: any = null;
  private resumeResolver: (() => void) | null = null;
  private userSpeed: number = 1.0;
  private userPitch: number = 1.0;
  private userVolume: number = 1.0;
  private phoneticBoost: boolean = true;
  private selectedVoiceURI: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  public loadVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices();
    return this.voices;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices;
  }

  /**
   * Asynchronously wait for browser voices to load if initially empty
   */
  public async ensureVoicesLoaded(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
    if (!this.synth) return [];
    let voices = this.getAvailableVoices();
    if (voices.length > 0) return voices;

    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        voices = this.loadVoices();
        if (voices.length > 0 || Date.now() - startTime > timeoutMs) {
          clearInterval(interval);
          resolve(voices);
        }
      }, 50);
    });
  }

  public setVoiceModulation(_accent: Accent, _gender: Gender, speed: number, pitch: number) {
    this.userSpeed = speed;
    this.userPitch = pitch;
  }

  public setVolume(volume: number) {
    this.userVolume = Math.max(0, Math.min(1, volume));
  }

  public getVolume(): number {
    return this.userVolume;
  }

  public setPhoneticBoost(enabled: boolean) {
    this.phoneticBoost = enabled;
  }

  public getPhoneticBoost(): boolean {
    return this.phoneticBoost;
  }

  public setSelectedVoice(voiceURI: string | null) {
    this.selectedVoiceURI = voiceURI;
  }

  public getSelectedVoice(): string | null {
    return this.selectedVoiceURI;
  }

  /**
   * Check whether a given voice is a native match for British or Australian
   */
  public isNativeAccentVoice(voice: SpeechSynthesisVoice, accent: Accent): boolean {
    const lang = voice.lang.replace('_', '-').toLowerCase();
    const name = voice.name.toLowerCase();
    const uri = voice.voiceURI.toLowerCase();

    if (accent === 'australian') {
      return (
        lang.startsWith('en-au') ||
        lang.includes('australia') ||
        name.includes('australia') ||
        name.includes('aussie') ||
        uri.includes('en-au')
      );
    } else {
      return (
        lang.startsWith('en-gb') ||
        lang.includes('uk') ||
        name.includes('united kingdom') ||
        name.includes('uk english') ||
        name.includes('great britain') ||
        name.includes('british') ||
        uri.includes('en-gb')
      );
    }
  }

  /**
   * Get all voices in browser filtered by accent
   */
  public getVoicesForAccent(accent: Accent): SpeechSynthesisVoice[] {
    const all = this.getAvailableVoices();
    return all.filter((v) => this.isNativeAccentVoice(v, accent));
  }

  /**
   * Diagnostic info for current accent & gender setup
   */
  public getVoiceDiagnostic(accent: Accent, gender: Gender): DetectedVoiceInfo {
    const voice = this.findBestVoice(accent, gender);
    if (!voice) {
      return {
        name: 'Browser Default Voice',
        lang: accent === 'australian' ? 'en-AU' : 'en-GB',
        voiceURI: 'default',
        isNative: false,
        accent,
      };
    }
    return {
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      isNative: this.isNativeAccentVoice(voice, accent),
      accent,
    };
  }

  /**
   * Find best matching voice for the chosen accent & gender
   */
  public findBestVoice(accent: Accent, gender: Gender): SpeechSynthesisVoice | null {
    const allVoices = this.getAvailableVoices();
    if (!allVoices.length) return null;

    // 0. If user manually selected a specific voice URI, honor it
    if (this.selectedVoiceURI) {
      const manualMatch = allVoices.find((v) => v.voiceURI === this.selectedVoiceURI);
      if (manualMatch) return manualMatch;
    }

    const artist = VOICE_ARTISTS[accent][gender];

    // 1. Exact match with preferred artist voice names (covers macOS, Windows, Google, Android)
    for (const prefName of artist.preferredVoiceNames) {
      const match = allVoices.find(
        (v) =>
          v.name.toLowerCase().includes(prefName.toLowerCase()) ||
          v.voiceURI.toLowerCase().includes(prefName.toLowerCase())
      );
      if (match) return match;
    }

    // 2. Match by native accent filter
    const accentVoices = allVoices.filter((v) => this.isNativeAccentVoice(v, accent));

    if (accentVoices.length > 0) {
      // Find gender match within accent voices
      if (gender === 'female') {
        const femaleMatch = accentVoices.find((v) =>
          /female|woman|girl|charlotte|libby|hazel|nicole|catherine|karen|hayley|natasha|susan|sonia|mia|kate|serena/i.test(
            v.name
          )
        );
        if (femaleMatch) return femaleMatch;
      } else {
        const maleMatch = accentVoices.find((v) =>
          /male|man|boy|arthur|george|oliver|daniel|russell|william|liam|james|ryan/i.test(v.name)
        );
        if (maleMatch) return maleMatch;
      }
      return accentVoices[0];
    }

    // 3. Fallback to any English voice (phonetic adapter will shape the accent)
    const enVoices = allVoices.filter((v) => v.lang.toLowerCase().startsWith('en'));
    return enVoices[0] || allVoices[0];
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (this.synth && this.isSpeaking && !this.isPaused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 9000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private async waitIfPaused(): Promise<void> {
    while (this.isPaused && !this.cancelRequested) {
      await new Promise<void>((resolve) => {
        this.resumeResolver = resolve;
      });
    }
  }

  /**
   * Speak a single word immediately (used when clicking word tokens in karaoke view)
   */
  public speakSingleWord(word: string, accent: Accent, gender: Gender) {
    if (!this.synth) return;
    try {
      this.synth.cancel();
      const artist = VOICE_ARTISTS[accent][gender];
      const voice = this.findBestVoice(accent, gender);
      
      // Use phonetic accent adaptation for true pronunciation
      const spokenWord = this.phoneticBoost ? adaptWordForAccent(word, accent) : word;
      const utterance = new SpeechSynthesisUtterance(spokenWord);
      
      if (voice) utterance.voice = voice;
      utterance.lang = artist.langCode;
      utterance.rate = Math.max(0.5, Math.min(2.0, artist.rate * this.userSpeed));
      utterance.pitch = Math.max(0.5, Math.min(2.0, artist.pitch * this.userPitch));
      utterance.volume = this.userVolume;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Could not pronounce single word', e);
    }
  }

  /**
   * Main speech controller: Handles both standard continuous speech with boundary tracking
   * and the customized "Word Count" timeout pause mode.
   */
  public async speak(
    text: string,
    accent: Accent,
    gender: Gender,
    wordPauseSettings: WordPauseSettings,
    callbacks: SpeechEngineCallbacks
  ) {
    this.stop();
    this.cancelRequested = false;

    if (!this.synth) {
      callbacks.onError('Speech synthesis is not supported on this browser.');
      return;
    }

    // Ensure voices have finished loading from OS/browser
    await this.ensureVoicesLoaded(500);

    const tokens = tokenizeText(text);
    if (tokens.length === 0) {
      callbacks.onError('Please enter some text to generate speech.');
      return;
    }

    callbacks.onStatusChange('generating');
    this.isSpeaking = true;
    this.isPaused = false;

    // Small delay to ensure any previous speech is completely flushed
    await new Promise((r) => setTimeout(r, 80));
    if (this.cancelRequested) return;

    callbacks.onStatusChange('playing');
    this.startKeepAlive();

    if (wordPauseSettings.enabled) {
      // WORD COUNT / WORD-BY-WORD TIMEOUT MODE:
      // Speaks word by word with explicit timeout pause between words!
      await this.speakWordByWord(tokens, accent, gender, wordPauseSettings.pauseDurationMs, callbacks);
    } else {
      // CONTINUOUS MODE with onboundary word highlight tracking
      await this.speakContinuous(text, tokens, accent, gender, callbacks);
    }

    this.stopKeepAlive();
  }

  /**
   * Word-by-Word speech with exact custom timeout pause between consecutive words
   */
  private async speakWordByWord(
    tokens: WordToken[],
    accent: Accent,
    gender: Gender,
    pauseDurationMs: number,
    callbacks: SpeechEngineCallbacks
  ) {
    const artist = VOICE_ARTISTS[accent][gender];
    const voice = this.findBestVoice(accent, gender);

    for (let i = 0; i < tokens.length; i++) {
      if (this.cancelRequested) break;
      await this.waitIfPaused();
      if (this.cancelRequested) break;

      const token = tokens[i];
      callbacks.onWordHighlight(i, token);
      callbacks.onProgress(Math.round(((i + 1) / tokens.length) * 100), i + 1, tokens.length);

      // Speak this individual word
      await new Promise<void>((resolve) => {
        if (!this.synth || this.cancelRequested) {
          resolve();
          return;
        }

        const spokenWord = this.phoneticBoost
          ? adaptWordForAccent(token.cleanWord, accent)
          : token.cleanWord;
        const utterance = new SpeechSynthesisUtterance(spokenWord);
        if (voice) utterance.voice = voice;
        utterance.lang = artist.langCode;
        utterance.rate = Math.max(0.5, Math.min(2.0, artist.rate * this.userSpeed));
        utterance.pitch = Math.max(0.5, Math.min(2.0, artist.pitch * this.userPitch));
        utterance.volume = this.userVolume;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
      });

      if (this.cancelRequested) break;
      await this.waitIfPaused();
      if (this.cancelRequested) break;

      // Now apply the custom TIMEOUT between words (if not the last word)
      if (i < tokens.length - 1 && pauseDurationMs > 0) {
        const stepMs = 50;
        let elapsed = 0;
        while (elapsed < pauseDurationMs && !this.cancelRequested) {
          await this.waitIfPaused();
          if (this.cancelRequested) break;
          await new Promise<void>((resolve) => {
            this.activeSequenceTimeout = setTimeout(resolve, stepMs);
          });
          elapsed += stepMs;
        }
      }
    }

    if (!this.cancelRequested) {
      callbacks.onWordHighlight(-1, null);
      callbacks.onStatusChange('finished');
      this.isSpeaking = false;
    }
  }

  /**
   * Continuous speech with real-time word boundary matching for word highlights
   */
  private async speakContinuous(
    text: string,
    tokens: WordToken[],
    accent: Accent,
    gender: Gender,
    callbacks: SpeechEngineCallbacks
  ) {
    const artist = VOICE_ARTISTS[accent][gender];
    const voice = this.findBestVoice(accent, gender);

    return new Promise<void>((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      const spokenText = this.phoneticBoost
        ? transformTextForAccent(text, accent, true)
        : text;
      const utterance = new SpeechSynthesisUtterance(spokenText);
      if (voice) utterance.voice = voice;
      utterance.lang = artist.langCode;
      utterance.rate = Math.max(0.5, Math.min(2.0, artist.rate * this.userSpeed));
      utterance.pitch = Math.max(0.5, Math.min(2.0, artist.pitch * this.userPitch));
      utterance.volume = this.userVolume;

      // Word highlight tracking via boundary event
      let wordCursor = 0;
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          let tokenIndex = -1;
          if (typeof event.charIndex === 'number' && !this.phoneticBoost) {
            tokenIndex = tokens.findIndex(
              (t) => event.charIndex >= t.startChar && event.charIndex <= t.endChar
            );
          }
          if (tokenIndex === -1 && wordCursor < tokens.length) {
            tokenIndex = wordCursor;
            wordCursor++;
          }
          if (tokenIndex !== -1 && tokenIndex < tokens.length) {
            callbacks.onWordHighlight(tokenIndex, tokens[tokenIndex]);
            callbacks.onProgress(
              Math.round(((tokenIndex + 1) / tokens.length) * 100),
              tokenIndex + 1,
              tokens.length
            );
          }
        }
      };

      utterance.onend = () => {
        callbacks.onWordHighlight(-1, null);
        callbacks.onStatusChange('finished');
        this.isSpeaking = false;
        this.stopKeepAlive();
        resolve();
      };

      utterance.onerror = (event) => {
        if (!this.cancelRequested) {
          callbacks.onError(`Speech playback issue: ${event.error}`);
        }
        callbacks.onWordHighlight(-1, null);
        callbacks.onStatusChange('idle');
        this.isSpeaking = false;
        this.stopKeepAlive();
        resolve();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  public pause() {
    this.isPaused = true;
    if (this.synth && this.isSpeaking) {
      this.synth.pause();
    }
  }

  public resume() {
    this.isPaused = false;
    if (this.resumeResolver) {
      this.resumeResolver();
      this.resumeResolver = null;
    }
    if (this.synth && this.isSpeaking) {
      this.synth.resume();
    }
  }

  public stop() {
    this.cancelRequested = true;
    this.stopKeepAlive();
    if (this.resumeResolver) {
      this.resumeResolver();
      this.resumeResolver = null;
    }
    if (this.activeSequenceTimeout) {
      clearTimeout(this.activeSequenceTimeout);
      this.activeSequenceTimeout = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  /**
   * Synthesize audio buffer for export (MP3 / WAV) with exact word timing,
   * pitch contour, and customizable pauses between words.
   */
  public async renderAudioBuffer(
    text: string,
    accent: Accent,
    gender: Gender,
    wordPauseSettings: WordPauseSettings
  ): Promise<AudioBuffer> {
    const tokens = tokenizeText(text);
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 44100,
    });

    const sampleRate = 44100;
    // Base pitch: Male ~130Hz, Female ~230Hz
    const baseFreq = gender === 'male' ? 125 : 220;
    const accentPitchFactor = accent === 'australian' ? 1.06 : 0.98;
    const fundamentalFreq = baseFreq * accentPitchFactor;

    // Calculate total duration using phonetically adapted word lengths
    const wordDurations = tokens.map((t) => {
      const phoneticWord = adaptWordForAccent(t.cleanWord, accent);
      return Math.max(0.28, Math.min(0.85, phoneticWord.length * 0.085));
    });
    const pauseSec = wordPauseSettings.enabled ? wordPauseSettings.pauseDurationMs / 1000 : 0.12;

    let totalDurationSec = 0.2; // intro padding
    for (let i = 0; i < tokens.length; i++) {
      totalDurationSec += wordDurations[i];
      if (i < tokens.length - 1) {
        totalDurationSec += pauseSec;
      }
    }
    totalDurationSec += 0.3; // tail padding

    const totalSamples = Math.ceil(totalDurationSec * sampleRate);
    const audioBuffer = audioContext.createBuffer(1, totalSamples, sampleRate);
    const channelData = audioBuffer.getChannelData(0);

    // Synthesize vocal formants for words
    let currentTimeSec = 0.2;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const phoneticWord = adaptWordForAccent(token.cleanWord, accent);
      const wordDur = wordDurations[i];
      const wordStartSample = Math.floor(currentTimeSec * sampleRate);
      const wordSampleCount = Math.floor(wordDur * sampleRate);

      // Acoustic envelope + formant frequencies for authentic accent timbre
      // British: sharper consonants, deeper fundamental, restrained pitch glide
      // Australian: rising intonation (Australian Questioning Intonation), broader diphthongs
      const f1 = gender === 'female' ? 650 : 500;
      const f2Base = accent === 'australian' ? (gender === 'female' ? 2100 : 1750) : (gender === 'female' ? 1850 : 1500);

      for (let s = 0; s < wordSampleCount; s++) {
        const sampleIdx = wordStartSample + s;
        if (sampleIdx >= totalSamples) break;

        const tNorm = s / wordSampleCount;
        // Attack-Decay-Sustain-Release envelope
        let env = 0;
        if (tNorm < 0.15) {
          env = tNorm / 0.15;
        } else if (tNorm > 0.75) {
          env = (1 - tNorm) / 0.25;
        } else {
          env = 1.0 - (tNorm - 0.15) * 0.15;
        }

        // Pitch inflection
        let pitchInflection = 1.0;
        if (accent === 'australian') {
          // Aussie rising terminal inflection (Strine uptalk)
          pitchInflection = 0.93 + tNorm * 0.18;
        } else {
          // British slight arc then drop (RP articulation)
          pitchInflection = 1.02 - Math.pow(tNorm - 0.3, 2) * 0.25;
        }

        // Broad diphthong formant shift for Australian
        const f2 = accent === 'australian' ? f2Base + (tNorm - 0.5) * 260 : f2Base;

        const currentFreq = fundamentalFreq * pitchInflection;
        const timeSec = s / sampleRate;

        // Glottal harmonic synthesis + formant resonances
        const glottal =
          0.5 * Math.sin(2 * Math.PI * currentFreq * timeSec) +
          0.3 * Math.sin(2 * Math.PI * currentFreq * 2 * timeSec) +
          0.15 * Math.sin(2 * Math.PI * currentFreq * 3 * timeSec) +
          0.08 * Math.sin(2 * Math.PI * currentFreq * 4 * timeSec);

        const formant1 = Math.sin(2 * Math.PI * f1 * timeSec) * 0.25;
        const formant2 = Math.sin(2 * Math.PI * f2 * timeSec) * 0.15;

        // Consonant friction burst at word onset if starts with sibilant
        let consonantBurst = 0;
        if (tNorm < 0.1 && /^[stcfpk]/i.test(phoneticWord)) {
          consonantBurst = (Math.random() * 2 - 1) * 0.12 * (1 - tNorm / 0.1);
        }

        channelData[sampleIdx] = (glottal * 0.6 + formant1 + formant2 + consonantBurst) * env * 0.65 * this.userVolume;
      }

      currentTimeSec += wordDur + pauseSec;
    }

    return audioBuffer;
  }
}

export const speechEngine = new AccentSpeechEngine();
