export const meta = {
  name: 'relapse',
  version: '1.0.0',
  aliases: ['r'],
  description: "Sends the lyrics of 'Bulong' (December Avenue) line-by-line — cooldown per number of words",
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 30,
  guide: ['(no args)']
};

const LINES = [
  // Verse 1
  "Hindi masabi ang nararamdaman",
  "'Di makalapit sadyang nanginginig na lang",
  "Mga kamay na sabik sa piling mo",
  "Ang 'yong matang walang mintis sa pagtigil ng aking mundo",

  // Chorus
  "Ako'y alipin ng pag-ibig mo",
  "Handang ibigin ang 'sang tulad mo",
  "Hangga't ang puso mo'y sa akin lang",
  "Hindi ka na malilinlang",
  "Ikaw ang ilaw sa dilim",
  "At ang liwanag ng mga bituin",

  // Verse 2
  "Hindi mapakali hanggang tingin na lang",
  "Bumubulong sa'yong tabi",
  "Sadyang walang makapantay",
  "Sa kagandahang inuukit mo sa isip ko",

  // Chorus (repeat)
  "Ako'y alipin ng pag-ibig mo",
  "Handang ibigin ang 'sang tulad mo",
  "Hangga't ang puso mo'y sa akin lang",
  "Hindi ka na malilinlang",
  "Ikaw ang ilaw sa dilim",
  "At ang liwanag ng mga bituin",

  // Instrumental bridge (represented as an empty pause line)
  "[Instrumental Bridge]",

  // Chorus (repeat)
  "Ako'y alipin ng pag-ibig mo",
  "Handang ibigin ang 'sang tulad mo",
  "Hangga't ang puso mo'y sa akin lang",
  "Hindi ka na malilinlang",
  "Ikaw ang ilaw sa dilim",
  "At ang liwanag ng mga bituin",

  // Outro (repeated lines)
  "(Ako'y alipin ng pag-ibig mo)",
  "Ng mga bituin",
  "(Handang ibigin ang 'sang tulad mo)",
  "Ng mga bituin",
  "(Ako'y alipin ng pag-ibig mo)",
  "Ng mga bituin",
  "(Handang ibigin ang 'sang tulad mo)"
];

// Timing settings
const WORD_DELAY_MS = 1000; // 1 second per word
const MIN_DELAY_MS = 500;   // minimum 0.5s
const MAX_DELAY_MS = 15000; // maximum 15s

function countWords(text) {
  if (!text) return 0;
  // Split on whitespace, ignore empty tokens
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function computeDelayForLine(line) {
  const words = countWords(line);
  const delay = words * WORD_DELAY_MS;
  // clamp to min/max
  return Math.max(MIN_DELAY_MS, Math.min(delay, MAX_DELAY_MS));
}

export async function onStart({ response }) {
  for (const line of LINES) {
    await response.send(line);

    const delayMs = computeDelayForLine(line);
    // await the computed cooldown before sending next line
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
