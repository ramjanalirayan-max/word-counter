import { WordToken } from '../types';

/**
 * Tokenizes text into individual words while tracking their exact character positions
 * for real-time visual karaoke highlighting.
 */
export function tokenizeText(text: string): WordToken[] {
  if (!text.trim()) return [];

  const tokens: WordToken[] = [];
  // Regex to match non-whitespace words and attached punctuation
  const regex = /(\S+)/g;
  let match: RegExpExecArray | null;
  let id = 0;

  while ((match = regex.exec(text)) !== null) {
    const rawWord = match[0];
    const startChar = match.index;
    const endChar = startChar + rawWord.length;
    // Clean punctuation for phonetics and clean word comparison
    const cleanWord = rawWord.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');

    tokens.push({
      id: id++,
      word: rawWord,
      cleanWord: cleanWord || rawWord,
      startChar,
      endChar,
      trailingSpace: ' ',
    });
  }

  return tokens;
}

/**
 * Calculate detailed statistics about the text and pacing
 */
export function calculateTextStats(text: string, pauseDurationMs: number = 0, isPauseEnabled: boolean = false) {
  const tokens = tokenizeText(text);
  const wordCount = tokens.length;
  const charCount = text.length;

  // Average speaking rate: ~150 words per minute (2.5 words per second => 0.4s per word)
  const baseSpeechSeconds = wordCount > 0 ? wordCount * 0.45 : 0;
  const pauseSeconds = isPauseEnabled && wordCount > 1 ? ((wordCount - 1) * pauseDurationMs) / 1000 : 0;
  const totalEstimatedSeconds = Math.max(0, Math.round(baseSpeechSeconds + pauseSeconds));

  return {
    tokens,
    wordCount,
    charCount,
    totalEstimatedSeconds,
    pauseSeconds,
    formattedDuration: formatSeconds(totalEstimatedSeconds),
  };
}

export function formatSeconds(sec: number): string {
  if (sec < 60) {
    return `${sec}s`;
  }
  const mins = Math.floor(sec / 60);
  const remSec = Math.round(sec % 60);
  return `${mins}m ${remSec < 10 ? '0' : ''}${remSec}s`;
}
