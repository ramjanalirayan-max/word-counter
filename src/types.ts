export type Accent = 'british' | 'australian';
export type Gender = 'male' | 'female';
export type AudioExportFormat = 'mp3' | 'wav' | 'webm';
export type PlaybackStatus = 'idle' | 'generating' | 'playing' | 'paused' | 'finished';

export interface VoiceArtist {
  id: string;
  name: string;
  gender: Gender;
  accent: Accent;
  title: string;
  accentDescription: string;
  samplePhrase: string;
  pitch: number;
  rate: number;
  langCode: string;
  preferredVoiceNames: string[];
}

export interface WordToken {
  id: number;
  word: string;
  cleanWord: string;
  startChar: number;
  endChar: number;
  trailingSpace: string;
}

export interface WordPauseSettings {
  enabled: boolean;
  pauseDurationMs: number; // Duration of pause after each word in milliseconds
  minPauseMs: number;
  maxPauseMs: number;
}

export interface DetectedVoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  isNative: boolean;
  accent: Accent;
}

export interface GeneratedAudioData {
  blob: Blob;
  url: string;
  format: AudioExportFormat;
  durationSeconds: number;
  source: 'browser' | 'gemini';
  accent: Accent;
  gender: Gender;
  wordCount: number;
  createdAt: string;
}

export interface SpellingWordAttempt {
  index: number;
  targetWord: string;
  typedWord: string;
  isCorrect: boolean;
  status: 'correct' | 'incorrect' | 'missed';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'email';
  createdAt: string;
  lastVisitAt: string;
  visitCount?: number;
}

export interface AdminStats {
  totalUsers: number;
  googleUsers: number;
  emailUsers: number;
  totalVisits: number;
  lastActiveEmail: string | null;
  lastActiveTime: string | null;
}

export interface ContactMessage {
  id: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'unread' | 'read';
  ip?: string;
}


