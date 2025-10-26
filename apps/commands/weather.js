import axios from "axios";

export const meta = {
  name: "weather",
  version: "1.0.1",
  aliases: ["w", "wt", "wthr"],
  description: "Get current weather by city name (uses wttr.in, no API key required)",
  author: "AjiroDesu",
  prefix: "both",
  category: "utility",
  type: "anyone",
  cooldown: 3,
  guide: ["<city name>"],
};

export async function onStart({ bot, msg, args, response, usages }) {
  if (!args.length) return usages();

  const query = args.join(" ");
  const loading = await response.reply(`🌤️ Searching weather for *${query}*...`, { parse_mode: "Markdown" });

  try {
    const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(query)}?format=j1`, { timeout: 10000 });
    const current = data?.current_condition?.[0];
    const area = data?.nearest_area?.[0];
    if (!current) throw new Error(`City *${query}* not found or no data returned.`);

    const name = area?.areaName?.[0]?.value || query;
    const country = area?.country?.[0]?.value || "";
    const desc = current.weatherDesc?.[0]?.value || "N/A";
    const icon = current.weatherIconUrl?.[0]?.value || "https://wttr.in/favicon.png";
    const { temp_C, FeelsLikeC, humidity, windspeedKmph, winddir16Point } = current;
    const astro = data?.weather?.[0]?.astronomy?.[0] || {};
    const { sunrise = "N/A", sunset = "N/A" } = astro;

    const caption = `
🌆 *Location:* ${name}${country ? `, ${country}` : ""}
☁️ *Weather:* ${desc}
🌡️ *Temp:* ${temp_C}°C (feels like ${FeelsLikeC}°C)
💧 *Humidity:* ${humidity}%
💨 *Wind:* ${windspeedKmph} km/h (${winddir16Point})
🌅 *Sunrise:* ${sunrise}  🌇 *Sunset:* ${sunset}
`;

    try { await response.delete(loading); } catch {}
    await response.photo(icon, { caption, parse_mode: "Markdown" });

  } catch (err) {
    const msgText = err?.response?.status
      ? `⚠️ API error: status ${err.response.status}`
      : `⚠️ ${err.message || "Unknown error"}`;

    try {
      await response.editText(loading, msgText, { parse_mode: "Markdown" });
    } catch {
      try { await response.delete(loading); } catch {}
      await response.reply(msgText, { parse_mode: "Markdown" });
    }
  }
}
