import { v4 as uuidv4 } from 'uuid';

export const meta = {
  name: 'dashboard',
  version: '1.0.0',
  aliases: [],
  description: 'Generate a one-time key to access the bot dashboard',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Utility',
  type: 'dev',  // Restrict to owners if needed
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
    return `https://${process.env.K_SERVICE}-dot-${process.env.K_REVISION}.run.app`;  // Approximate, may not be accurate
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
  if (process.cwd().startsWith('/home/container') || process.env.HOME === '/home/container') {
    return process.env.APP_URL || 'Pterodactyl - URL not set in APP_URL';
  }
  // Fallback for local or unknown environments
  return 'Local or Unknown - No URL available';
}

export async function onStart({ bot, msg, args, response, usages }) {

  const key = uuidv4().replace(/-/g, '');  // Generate unique key without dashes
  global.chaldea.keys.add(key);

  const hostingUrl = detectHostingUrl();

  // Format the key as inline-code in Markdown so it appears monospace when sent to users
  const message = `🔑 *Dashboard Access Key Generated:*\n\n\`${key}\`\n\n_Current Hosting: ${hostingUrl}_\n\n_Enter this key on the website to access the dashboard. This is a one-time key._`;

  return response.reply(message, { parse_mode: 'Markdown' });
}