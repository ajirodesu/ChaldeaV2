import axios from 'axios';

export const meta = {
  name: 'weather',
  version: '1.0.0',
  aliases: ['accuweather', 'aw'],
  description: 'Get AccuWeather forecast (via Nekolabs)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'Utilities',
  type: 'anyone',
  cooldown: 3,
  guide: ['<city name> — e.g. Lucena City']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const q = args.join(' ').trim();
  if (!q) return usages();

  const load = await response.reply('🌤️ Fetching weather...', { parse_mode: 'Markdown' });
  try {
    const { data } = await axios.get(`${global.api.nekolabs}/discovery/accuweather/search`, {
      params: { city: q }
    });

    if (!data?.success || !data?.result)
      return response.editText(load, '⚠️ No data from weather API.', { parse_mode: 'Markdown' });

    const r = data.result;
    const loc = r.location || {};
    const fd = r.forecastData || {};
    const days = Array.isArray(fd.DailyForecasts) ? fd.DailyForecasts : [];

    let out = `📍 *${loc.name || 'Unknown'}*, *${loc.country || '—'}*\n`;
    if (fd.Text) out += `\n${fd.Text}\n`;
    if (fd.Date) out += `\n*As of:* ${fd.Date}\n`;
    out += `\n*Daily Forecasts:*\n`;

    days.slice(0, 10).forEach(d => {
      const day = d.Day || {};
      const night = d.Night || {};
      const t = d.Temperature || {};
      const min = t.Min ?? '—';
      const max = t.Max ?? '—';
      out += `\n• *${d.Date}*\n  • Day: ${day.IconPhrase || '—'} (${day.PrecipitationProbability ?? 0}% precip)\n  • Night: ${night.IconPhrase || '—'} (${night.PrecipitationProbability ?? 0}% precip)\n  • Temp: ${min}° — ${max}°\n  • Wind Day: ${day.Wind?.Speed ?? '—'} km/h ${day.Wind?.Direction ?? ''}\n  • Sun: ${d.HoursOfSun ?? '—'} hrs\n`;
    });

    if (out.length > 4000) {
      await response.editText(load, '✅ Forecast retrieved — sending as file.');
      return response.document(Buffer.from(out, 'utf8'), { filename: 'weather.txt' });
    }

    await response.editText(load, out, { parse_mode: 'Markdown', disable_web_page_preview: true });
  } catch (e) {
    await response.editText(load, `⚠️ Error: ${e.message}`, { parse_mode: 'Markdown' });
  }
}
