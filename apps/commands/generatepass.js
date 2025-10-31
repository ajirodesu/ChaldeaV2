/**
 * generatepass command (ES module style)
 * - Uses your R response wrapper via the `response` object.
 * - Generates 6 strong passwords based on an optional base word.
 * - Keeps same generation logic as your original code but fixed minor binding issue.
 */

export const meta = {
  name: 'generatepass',
  version: '1.0.0',
  aliases: ['genpass', 'password'],
  description: 'Generate strong passwords with optional base word',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 3,
  guide: [
    '<base_word>  - generate passwords based on base word',
    'banana'
  ]
};

/* Password generator class (self-contained, no external deps) */
class PasswordGenerator {
  constructor() {
    this.charsets = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_'
    };
  }

  generatePassword(baseWord = '', length = 12) {
    if (length < 7 || length > 32) {
      throw new Error('Password length must be between 7 and 32 characters');
    }

    // full charset
    let charset =
      this.charsets.lowercase +
      this.charsets.uppercase +
      this.charsets.numbers +
      this.charsets.symbols;

    const processedBaseWord = this.processBaseWord(baseWord, length);
    const additionalLength = Math.max(0, length - processedBaseWord.length);
    const additionalChars = this.generateRandomChars(charset, additionalLength);

    const passwordChars = [...processedBaseWord, ...additionalChars.split('')];

    return this.shuffleArray(passwordChars).join('');
  }

  processBaseWord(baseWord, totalLength) {
    if (!baseWord) return [];
    const transformedWord = baseWord
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, Math.floor(totalLength / 2));
    // ensure proper `this` binding by calling the method via arrow
    return transformedWord.split('').map((ch) => this.randomlyModifyChar(ch));
  }

  randomlyModifyChar(char) {
    const modifications = {
      a: '@',
      e: '3',
      i: '!',
      o: '0',
      s: '$'
    };
    return Math.random() < 0.3 && modifications[char] ? modifications[char] : char;
  }

  generateRandomChars(charset, length) {
    let randomChars = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomChars += charset[randomIndex];
    }
    return randomChars;
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
    }
    return array;
  }
}

/* Helper */
function safe(v) {
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

/* Main command */
export async function onStart({ bot, msg, args, response, usages }) {
  try {
    // Allow multi-word base word: join args (trim)
    const baseWord = (args && args.length) ? args.join(' ').trim() : '';

    // If no base word provided, show usage message
    if (!baseWord) {
      const usageMessage = [
        '💡 Usage: generatepass [base_word]',
        '- Generates 6 strong passwords based on the base word (if provided).',
        '- Passwords are between 7 and 32 characters long.',
        '',
        'Example:',
        '/generatepass banana'
      ].join('\n');

      return response.reply(usageMessage, { parse_mode: 'HTML' });
    }

    const passwordGenerator = new PasswordGenerator();
    const passwordLength = 12; // default/constant length as original
    const passwords = [];

    for (let i = 0; i < 6; i++) {
      const password = passwordGenerator.generatePassword(baseWord, passwordLength);
      // Use HTML code tag for monospace
      passwords.push(`${i + 1}: <code>${password}</code>`);
    }

    const firstName = msg.from?.first_name || 'there';
    const responseMessage = [
      `Hey ${safe(firstName)}, here are your generated passwords for "${safe(baseWord)}":`,
      '🔐 Generated Passwords:',
      '',
      ...passwords
    ].join('\n');

    await response.send(responseMessage, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('Password Generation Error:', err);
    try {
      await response.reply(`❌ Error: ${safe(err?.message || String(err))}`);
    } catch (e) { /* ignore */ }
  }
}
