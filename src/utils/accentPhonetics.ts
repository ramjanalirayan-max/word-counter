/**
 * Accent Phonetics & Lexical Adaptation Engine
 *
 * Provides real-time phonetic transformations for British (RP) and Australian English
 * to ensure authentic accent pronunciation on any browser, operating system, or device,
 * even when the host system defaults to a generic or American speech voice.
 */

import { Accent } from '../types';

// British Received Pronunciation (RP) dictionary
const BRITISH_PHONETIC_MAP: Record<string, string> = {
  "can't": "cahn't",
  "cannot": "cah-not",
  "dance": "dahnce",
  "dancing": "dahncing",
  "danced": "dahnced",
  "dancer": "dahn-suh",
  "fast": "fahst",
  "faster": "fah-stuh",
  "fastest": "fah-stest",
  "half": "hahf",
  "halves": "hahvz",
  "laugh": "lahf",
  "laughed": "lahft",
  "laughter": "lahf-tuh",
  "laughing": "lahfing",
  "path": "pahth",
  "paths": "pahths",
  "bath": "bahth",
  "baths": "bahths",
  "water": "wah-tuh",
  "better": "beh-tuh",
  "matter": "mah-tuh",
  "letter": "leh-tuh",
  "butter": "buh-tuh",
  "schedule": "shed-yool",
  "scheduled": "shed-yoold",
  "tomato": "tuh-mah-toh",
  "tomatoes": "tuh-mah-tohz",
  "banana": "buh-nah-nuh",
  "bananas": "buh-nah-nuhz",
  "castle": "cahs-uhl",
  "castles": "cahs-uhlz",
  "glass": "glahs",
  "glasses": "glahs-iz",
  "class": "clahs",
  "classes": "clahs-iz",
  "pass": "pahs",
  "passed": "pahst",
  "past": "pahst",
  "master": "mah-stuh",
  "plaster": "plah-stuh",
  "disaster": "diz-ahs-tuh",
  "after": "ahf-tuh",
  "afternoon": "ahf-tuh-noon",
  "afterwards": "ahf-tuh-wudz",
  "ask": "ahsk",
  "asked": "ahskt",
  "asking": "ahsking",
  "answer": "ahn-suh",
  "answers": "ahn-suhz",
  "answered": "ahn-suhd",
  "answering": "ahn-suh-ring",
  "example": "eg-zahm-puhl",
  "sample": "sahm-puhl",
  "chance": "chahnce",
  "chances": "chahn-siz",
  "glance": "glahnce",
  "plant": "plahnt",
  "plants": "plahnts",
  "grant": "grahnt",
  "garage": "gah-rahzh",
  "here": "hee-uh",
  "there": "theh-uh",
  "where": "weh-uh",
  "care": "keh-uh",
  "car": "cah",
  "cars": "cahz",
  "park": "pahk",
  "parking": "pah-king",
  "hard": "hahd",
  "father": "fah-thuh",
  "mother": "muh-thuh",
  "brother": "bruh-thuh",
  "weather": "weh-thuh",
  "together": "tuh-geh-thuh",
  "rather": "rah-thuh",
  "clever": "cleh-vuh",
  "never": "neh-vuh",
  "ever": "eh-vuh",
  "river": "rih-vuh",
  "sugar": "shoo-guh",
  "dinner": "dih-nuh",
  "summer": "suh-muh",
  "winter": "win-tuh",
  "paper": "pay-puh",
  "quarter": "kwaw-tuh",
  "doctor": "dok-tuh",
  "actor": "ak-tuh",
  "flavour": "flay-vuh",
  "colour": "cuh-luh",
  "honour": "on-uh",
  "brisk": "brisk",
  "splendour": "splen-duh",
};

// Australian English (General Australian / Strine) dictionary
const AUSTRALIAN_PHONETIC_MAP: Record<string, string> = {
  // Classic Australian Place Names
  "melbourne": "Mel-bun",
  "brisbane": "Briz-bun",
  "canberra": "Can-bruh",
  "australia": "Oss-stray-lee-uh",
  "australian": "Oss-stray-lee-un",
  "australians": "Oss-stray-lee-unz",
  "sydney": "Sid-nee",
  "adelaide": "Add-uh-laid",
  "perth": "Puhth",
  "queensland": "Queens-luhnd",

  // Iconic Aussie greetings & idioms
  "g'day": "Guh-day",
  "mate": "m-aayt",
  "mates": "m-aayts",
  "crikey": "croy-kee",
  "fair dinkum": "feh dink-um",
  "strewth": "strooth",
  "barbie": "bah-bee",
  "barbecue": "bah-buh-kew",
  "arvo": "ah-voh",
  "brekkie": "brek-kee",
  "cheers": "chee-ahs",

  // Vowel & Intonation shifts (broad diphthongs and non-rhotic vowels)
  "today": "tuh-die",
  "day": "d-eye",
  "days": "d-eyez",
  "great": "gr-aayt",
  "water": "waw-tah",
  "better": "beh-tah",
  "matter": "mah-tah",
  "letter": "leh-tah",
  "butter": "buh-tah",
  "after": "ahf-tah",
  "afternoon": "ahf-tah-noon",
  "can't": "cahn't",
  "cannot": "cah-not",
  "dance": "dahnce",
  "dancing": "dahncing",
  "fast": "fahst",
  "faster": "fah-stah",
  "ask": "ahsk",
  "asked": "ahskt",
  "path": "pahth",
  "bath": "bahth",
  "laugh": "lahf",
  "half": "hahf",
  "chance": "chahnce",
  "plant": "plahnt",
  "castle": "cahs-uhl",
  "glass": "glahs",
  "here": "hee-ah",
  "there": "theh-ah",
  "where": "weh-ah",
  "care": "keh-ah",
  "car": "cah",
  "cars": "cahz",
  "park": "pahk",
  "father": "fah-thah",
  "mother": "muh-thah",
  "brother": "bruh-thah",
  "weather": "weh-thah",
  "together": "tuh-geh-thah",
  "summer": "suh-mah",
  "winter": "win-tah",
  "river": "rih-vah",
  "dinner": "dih-nah",
  "paper": "pay-pah",
  "splendour": "splen-dah",
  "sunshine": "sun-shoyn",
  "night": "noyt",
  "right": "royt",
  "alright": "awl-royt",
  "beauty": "bew-tee",
  "bonza": "bon-zah",
};

/**
 * Match word casing (capitalize if original was capitalized, uppercase if all-caps)
 */
function matchCase(original: string, target: string): string {
  if (!original || !target) return target;
  if (original === original.toUpperCase() && original.length > 1) {
    return target.toUpperCase();
  }
  if (original[0] === original[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
}

/**
 * Phonetically adapt a single clean word based on the chosen accent.
 */
export function adaptWordForAccent(word: string, accent: Accent): string {
  const lower = word.toLowerCase();
  const map = accent === 'australian' ? AUSTRALIAN_PHONETIC_MAP : BRITISH_PHONETIC_MAP;

  if (map[lower]) {
    return matchCase(word, map[lower]);
  }

  // General non-rhotic rule for words ending in 'er' (like 'teacher', 'walker', 'writer')
  if (lower.length > 4 && lower.endsWith('er') && !lower.endsWith('eer')) {
    const root = word.slice(0, -2);
    const suffix = accent === 'australian' ? 'ah' : 'uh';
    return root + suffix;
  }

  return word;
}

/**
 * Transform an entire sentence or text string into phonetically tuned speech text.
 * Punctuation, spacing, and casing are strictly preserved.
 */
export function transformTextForAccent(text: string, accent: Accent, enabled: boolean = true): string {
  if (!enabled || !text) return text;

  // Regex matches word tokens and preserves delimiters (punctuation, spaces)
  return text.replace(/\b[a-zA-Z'’-]+\b/g, (matched) => {
    return adaptWordForAccent(matched, accent);
  });
}

/**
 * Benchmark accent test words for real-time comparison
 */
export const ACCENT_BENCHMARKS = [
  {
    id: 'water',
    word: 'Water',
    britishPhonetic: 'Wah-tuh',
    australianPhonetic: 'Waw-tah',
    britishDescription: 'Crisp aspirated "t", RP non-rhotic schwa',
    australianDescription: 'Open "waw", relaxed broad vowel ending',
  },
  {
    id: 'dance',
    word: 'Dance',
    britishPhonetic: 'Dahnce',
    australianPhonetic: 'Dahnce',
    britishDescription: 'Broad /ɑː/ vowel, refined articulation',
    australianDescription: 'Broad /ɑː/ with relaxed jaw posture',
  },
  {
    id: 'cant',
    word: "Can't",
    britishPhonetic: "Cahn't",
    australianPhonetic: "Cahn't",
    britishDescription: 'Deep back vowel /ɑː/, no American nasalization',
    australianDescription: 'Crisp RP-influenced broad vowel',
  },
  {
    id: 'melbourne',
    word: 'Melbourne',
    britishPhonetic: 'Mel-buhn',
    australianPhonetic: 'Mel-bun',
    britishDescription: 'Soft schwa ending',
    australianDescription: 'Authentic local "Mel-bun" (not American "Mel-born")',
  },
  {
    id: 'gday',
    word: "G'day Mate",
    britishPhonetic: 'Good day, my friend',
    australianPhonetic: "Guh-day m-aayt",
    britishDescription: 'Dignified traditional greeting',
    australianDescription: 'Authentic Strine diphthong & warm inflection',
  },
  {
    id: 'schedule',
    word: 'Schedule',
    britishPhonetic: 'Shed-yool',
    australianPhonetic: 'Shed-yool',
    britishDescription: 'Classic BBC "shed-yool" pronunciation',
    australianDescription: 'Traditional Commonwealth "shed-yool"',
  },
  {
    id: 'tomato',
    word: 'Tomato',
    britishPhonetic: 'Tuh-mah-toh',
    australianPhonetic: 'Tuh-mah-toh',
    britishDescription: 'Broad "mah" middle vowel',
    australianDescription: 'Broad "mah" with open resonance',
  },
  {
    id: 'afternoon',
    word: 'Afternoon',
    britishPhonetic: 'Ahf-tuh-noon',
    australianPhonetic: 'Ahf-tah-noon',
    britishDescription: 'Long /ɑː/ start, crisp non-rhotic middle',
    australianDescription: 'Warm Australian broad vowel delivery',
  },
];
