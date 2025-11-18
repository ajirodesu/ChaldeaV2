import crypto from 'crypto';

export const meta = {
  name: 'dashboard',
  version: '1.0.0',
  aliases: [],
  description: 'Generate a one-time key to access the bot dashboard',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Utility',
  type: 'anyone',
  cooldown: 5,
  guide: ['Generate dashboard access key']
};

function detectHostingUrl() {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.RENDER) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  if (process.env.DATABASE_URL && process.env.PORT && process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  }
  if (process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return 'AWS - URL not automatically available';
  }
  if (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT) {
    return 'Google Cloud - URL not automatically available';
  }
  if (process.env.AZURE_WEBJOBS_STORAGE || process.env.WEBSITE_SITE_NAME) {
    return `https://${process.env.WEBSITE_HOSTNAME}`;
  }
  if (process.env.K_SERVICE || process.env.K_REVISION) {
    return `https://${process.env.K_SERVICE}-dot-${process.env.K_REVISION}.run.app`;
  }
  if (process.env.NOW_BUILDER) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NETLIFY) {
    return process.env.URL;
  }
  if (process.env.FLY_APP_NAME) {
    return `https://${process.env.FLY_APP_NAME}.fly.dev`;
  }
  if (process.env.DENO_DEPLOYMENT_ID) {
    return 'Deno Deploy - URL requires project name';
  }
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  // Pterodactyl common container path
  if (process.cwd().startsWith('/home/container') || process.env.HOME === '/home/container') {
    return process.env.APP_URL || 'PTERODACTYL';
  }
  // Fallback for local or unknown environments
  return 'Local or Unknown - No URL available';
}

function encrypt(text) {
  const secret = global.settings.secret;
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64');
}

export async function onStart({ bot, msg, args, response, usages }) {
  const devIDs = global.settings.devID ? (Array.isArray(global.settings.devID) ? global.settings.devID : [global.settings.devID]) : [];
  const userId = msg.from.id.toString();
  const isDev = devIDs.includes(userId);
  const keyBase = isDev ? devIDs.find(id => id === userId) : userId;
  const plainKey = crypto.randomBytes(2).toString('hex') + '-' + keyBase; // Ultra shortened key

  // Store plain key metadata (one-time flag + timestamp)
  global.chaldea.keys.set(plainKey, { isDev, createdAt: Date.now(), used: false });

  const encryptedKey = encrypt(plainKey);

  const hosting = detectHostingUrl();

  // If hosting is Pterodactyl, only send the key (no hosting URL text)
  if (hosting === 'PTERODACTYL' || (typeof hosting === 'string' && hosting.includes('Pterodactyl'))) {
    const message = `🔑 *Dashboard Access Key Generated:*\n\n\`${encryptedKey}\`\n\n_This is a one-time key._`;
    return response.reply(message, { parse_mode: 'Markdown' });
  }

  // Normal response with hosting info for other providers / local
  const hostingText = hosting === 'Local or Unknown - No URL available'
    ? `_Hosting: Local or Unknown_`
    : `_Current Hosting: ${hosting}_`;

  const message = `🔑 *Dashboard Access Key Generated:*\n\n\`${encryptedKey}\`\n\n${hostingText}\n\n_Enter this key on the website to access the dashboard. This is a one-time key._`;
  return response.reply(message, { parse_mode: 'Markdown' });
}