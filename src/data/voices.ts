import { VoiceArtist } from '../types';

export const VOICE_ARTISTS: Record<'british' | 'australian', { male: VoiceArtist; female: VoiceArtist }> = {
  british: {
    male: {
      id: 'uk-male-arthur',
      name: 'Arthur Sterling',
      gender: 'male',
      accent: 'british',
      title: 'Oxford & BBC Standard',
      accentDescription: 'Refined British Received Pronunciation (RP), crisp consonants, and authoritative baritone tone.',
      samplePhrase: 'Good afternoon. The British accent delivers clarity, poise, and dignified cadence.',
      pitch: 0.95,
      rate: 0.95,
      langCode: 'en-GB',
      preferredVoiceNames: [
        'Oliver', 'George', 'Daniel', 'Arthur', 'Ryan', 'Google UK English Male',
        'Microsoft George Desktop', 'Microsoft George', 'Microsoft Ryan', 'Microsoft Oliver',
        'en-GB-Standard-B', 'en-GB-Wavenet-B', 'en-GB-Neural2-B', 'en-GB'
      ],
    },
    female: {
      id: 'uk-female-charlotte',
      name: 'Charlotte Kensington',
      gender: 'female',
      accent: 'british',
      title: 'London Classical & Sophisticated',
      accentDescription: 'Elegant British tone, melodic pitch contour, precise non-rhotic vowels and smooth phrasing.',
      samplePhrase: 'Welcome to voice generation. Notice the distinct British pronunciation and rhythmic elegance.',
      pitch: 1.05,
      rate: 0.98,
      langCode: 'en-GB',
      preferredVoiceNames: [
        'Libby', 'Hazel', 'Stephanie', 'Charlotte', 'Serena', 'Kate', 'Martha', 'Fiona',
        'Google UK English Female', 'Microsoft Susan Desktop', 'Microsoft Susan',
        'Microsoft Hazel Desktop', 'Microsoft Hazel', 'Microsoft Libby', 'Microsoft Sonia',
        'en-GB-Standard-A', 'en-GB-Wavenet-A', 'en-GB-Neural2-A', 'en-GB'
      ],
    },
  },
  australian: {
    male: {
      id: 'au-male-jack',
      name: 'Jack Hawthorne',
      gender: 'male',
      accent: 'australian',
      title: 'Melbourne & Outlaw Baritone',
      accentDescription: 'Warm Australian cadence, broad diphthongs, characteristic upward inflection and relaxed clarity.',
      samplePhrase: "G'day mate. The Australian accent brings vibrant energy, natural pacing, and relaxed warmth.",
      pitch: 0.96,
      rate: 0.97,
      langCode: 'en-AU',
      preferredVoiceNames: [
        'Russell', 'Lee', 'James', 'William', 'Liam', 'Google English (Australia)',
        'Microsoft James Desktop', 'Microsoft James', 'Microsoft Russell',
        'en-AU-Standard-B', 'en-AU-Wavenet-B', 'en-AU-Neural2-B', 'en-AU'
      ],
    },
    female: {
      id: 'au-female-chloe',
      name: 'Chloe Sutherland',
      gender: 'female',
      accent: 'australian',
      title: 'Sydney Coastal & Vibrant',
      accentDescription: 'Crisp Australian intonation, open vowels, melodic rhythm, and friendly down-under pronunciation.',
      samplePhrase: 'Hello everyone! Enjoy genuine Australian speech with crisp pacing and authentic vocal dynamics.',
      pitch: 1.08,
      rate: 1.0,
      langCode: 'en-AU',
      preferredVoiceNames: [
        'Karen', 'Catherine', 'Nicole', 'Hayley', 'Natasha', 'Matilda',
        'Google English (Australia)', 'Microsoft Catherine Desktop', 'Microsoft Catherine',
        'Microsoft Hayley', 'Microsoft Natasha',
        'en-AU-Standard-A', 'en-AU-Wavenet-A', 'en-AU-Neural2-A', 'en-AU'
      ],
    },
  },
};

export const SAMPLE_TEXTS = [
  {
    title: 'British Classic (Articulate)',
    accent: 'british' as const,
    text: 'A cup of tea on a rainy London afternoon brings a quiet moment of contemplation. Precision in speech requires patient pronunciation and balanced articulation.',
  },
  {
    title: 'Australian Everyday (Vibrant)',
    accent: 'australian' as const,
    text: "The sun rises over Sydney Harbour with breathtaking splendour. Take your time to practice each word and listen closely to the distinct Australian cadence.",
  },
  {
    title: 'Word-by-Word Pronunciation Practice',
    accent: 'british' as const,
    text: 'Mastering clear pronunciation requires speaking each word distinctly with purposeful pauses between syllables.',
  },
];
