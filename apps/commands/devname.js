/**
 * devname command — ES module + response wrapper
 * - Usage: /devname <name> [style]
 * - Styles: classic, leet, minimalist, tech
 * - Generates 6 variations per style
 */

export const meta = {
  name: 'devname',
  version: '1.0.0',
  aliases: ['devnick', 'devusername'],
  description: 'Generate cool developer usernames based on your name',
  author: 'JohnDev19',
  prefix: 'both',
  category: 'fun',
  type: 'anyone',
  cooldown: 3,
  guide: [
    '<your_name>',
    '<your_name> <styles: classic, leet, minimalist, tech>'
  ]
};

/* ---------- Data sets ---------- */
const prefixes = [
  'cyber','tech','code','dev','hack','byte','pixel','data','web','net','algo','script','logic','proto','meta',
  'digital','binary','quantum','neural','crypto','machine','cloud','zero','stack','core','spark','prime','matrix',
  'flux','nano','system','micro','intel','async','sync','root','admin','kernel','lambda','debug','circuit','network',
  'stream','buffer','cache','block','thread','signal','proxy','pulse','blade','bolt','drone','alpha','beta','gamma',
  'delta','echo','omega','ai','ml','deep','learn','brain','smart','compute','daemon','router','server','client','host',
  'gateway','build','compile','test','deploy','scale','optimize','refactor','design','engineer','program','create','innovate',
  'solve','craft','algo','math','graph','tensor','spark','fire','blaze','storm','wave','river','ocean','star','galaxy',
  'cosmos','nebula','planet','solar','lunar','bit','render','parallel','distributed','node','mesh','grid','chip','processor',
  'cryptic','cipher','encode','secure','dynamic','static','runtime','abstract','virtual','prime','base','central','nano',
  'micro','mega','tera','neural','adaptive','reasoning','quantum','superposition','cyber','virtual','global','proto','meta',
  'hyper','ultra','multi','dynamic','elastic','agile','robust','innovative'
];

const suffixes = [
  'warrior','champion','elite','legend','titan','phoenix','dragon','wolf','hawk','fox','knight','samurai','ranger',
  'sentinel','guardian','shield','blade','storm','thunder','master','sage','guru','sensei','oracle','seer','architect',
  'hunter','scout','slayer','breaker','crusher','spark','flame','blaze','inferno','nova','star','comet','rocket','prime',
  'omega','alpha','force','pulse','wave','surge','spirit','mind','genius','protector','fortress','voyager','pioneer',
  'blade','edge','razor','sword','storm','shadow','ghost','phantom','void','rock','mountain','ocean','frost','ice','glacier'
];

const techTerms = [
  'git','node','react','vue','rust','java','py','go','ruby','swift','docker','kubernetes','nginx','kafka','redis','mongo',
  'graphql','webpack','babel','typescript','kotlin','dart','elixir','angular','svelte','express','django','flask','fastapi',
  'spring','mysql','postgres','sqlite','aws','azure','gcp','heroku','linux','ubuntu','arch','aws','jenkins','github','gitlab'
];

const leetReplacements = { a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', b: '8', g: '9' };

/* ---------- Generator ---------- */
class DevNameGenerator {
  constructor(variationsCount = 6) {
    this.styles = ['classic', 'leet', 'minimalist', 'tech'];
    this.variationsCount = variationsCount;
  }

  _rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  _randNum(max = 999) { return Math.floor(Math.random() * (max + 1)); }

  generateClassicVariations(name) {
    const out = [];
    const base = name.toLowerCase();
    for (let i = 0; i < this.variationsCount; i++) {
      out.push(`${this._rand(prefixes)}${base}${this._rand(suffixes)}`);
    }
    return out;
  }

  generateLeetVariations(name) {
    const out = [];
    for (let i = 0; i < this.variationsCount; i++) {
      let leet = name.toLowerCase();
      Object.entries(leetReplacements).forEach(([k, v]) => {
        if (Math.random() > 0.5) leet = leet.replace(new RegExp(k, 'g'), v);
      });
      out.push(`${this._rand(prefixes)}_${leet}_${this._randNum()}`);
    }
    return out;
  }

  generateMinimalistVariations(name) {
    const out = [];
    const base = name.toLowerCase();
    const noVowels = base.replace(/[aeiou]/g, '') || base;
    out.push(`_${base}_`, `-${base}-`, `.${base}.`);
    out.push(`_${noVowels}_`, `-${noVowels}-`, `.${noVowels}.`);
    return out.slice(0, this.variationsCount);
  }

  generateTechVariations(name) {
    const out = [];
    const base = name.toLowerCase();
    for (let i = 0; i < this.variationsCount; i++) {
      const tech = this._rand(techTerms);
      out.push(i % 2 === 0 ? `${tech}.${base}.dev` : `${base}.${tech}.io`);
    }
    return out;
  }

  generateMultipleNames(name) {
    return this.styles.map((style) => {
      return { style, names: this[`generate${style.charAt(0).toUpperCase() + style.slice(1)}Variations`](name) };
    });
  }

  generateStyle(name, style) {
    switch (style) {
      case 'classic': return this.generateClassicVariations(name);
      case 'leet': return this.generateLeetVariations(name);
      case 'minimalist': return this.generateMinimalistVariations(name);
      case 'tech': return this.generateTechVariations(name);
      default: return [];
    }
  }

  validateName(name) {
    return /^[a-zA-Z]{2,20}$/.test(name);
  }
}

/* ---------- Command handler ---------- */
export async function onStart({ bot, msg, args, response }) {
  const generator = new DevNameGenerator(6);

  // show help if no args
  if (!args || args.length === 0) {
    const help = [
      '🔥 *Developer Username Generator*',
      '',
      '*Usage:* `/devname <your_name> [style]`',
      '*Styles:* classic, leet, minimalist, tech',
      '',
      'Rules:',
      '- Name: 2-20 letters (A-Z), no spaces or special chars',
      '- Example: `/devname john` or `/devname john classic`',
      '',
      'Each style generates 6 unique variations.'
    ].join('\n');
    return response.reply(help, { parse_mode: 'Markdown' });
  }

  const name = String(args[0]).trim();
  const style = args[1]?.toLowerCase();

  if (!generator.validateName(name)) {
    return response.reply('⚠️ Invalid name! Use only letters (2-20 characters).', { parse_mode: 'Markdown' });
  }

  if (style && !generator.styles.includes(style)) {
    return response.reply('⚠️ Invalid style! Available: classic, leet, minimalist, tech', { parse_mode: 'Markdown' });
  }

  try {
    let text;
    if (style) {
      const variations = generator.generateStyle(name, style);
      text = [`🎯 *Your ${style} developer usernames:*`, '', ...variations.map((n, i) => `${i + 1}. \`${n}\``)].join('\n');
    } else {
      const blocks = generator.generateMultipleNames(name).map(s => {
        return `*${s.style.charAt(0).toUpperCase() + s.style.slice(1)}*\n${s.names.slice(0, 6).map((n, i) => `${i + 1}. \`${n}\``).join('\n')}`;
      });
      text = ['🎨 *Your Developer Usernames:*', '', ...blocks].join('\n\n');
    }

    await response.send(text, { parse_mode: 'Markdown', reply_to_message_id: msg.message_id });
  } catch (err) {
    console.error('DevName generation error:', err);
    await response.reply('😅 Oops! Something went wrong. Please try again.', { parse_mode: 'Markdown' });
  }
}
