import axios from "axios";

export const meta = {
  name: "wallpaper",
  version: "1.0.0",
  aliases: ["wp", "wall"],
  description: 'Send a random wallpaper. Optionally provide a query and/or size (e.g. "space 2560x1440").',
  author: "AjiroDesu",
  prefix: "both",
  category: "utility",
  type: "anyone",
  cooldown: 3,
  guide: ['[query] [widthxheight] — examples: "space", "mountains 1920x1080"'],
};

function parseArgs(args = []) {
  let width = 1920, height = 1080;
  const parts = args.slice();
  const last = parts[parts.length - 1] || "";
  const m = /^(\d{2,4})x(\d{2,4})$/i.exec(last);
  if (m) {
    width = Math.min(3840, parseInt(m[1], 10));
    height = Math.min(2160, parseInt(m[2], 10));
    parts.pop();
  }
  const query = (parts.join(" ").trim() || "wallpaper");
  return { query, width, height };
}

export async function onStart({ bot, msg, args, response }) {
  const { query, width, height } = parseArgs(args);
  const loadingText = `🖼️ Finding a *${width}x${height}* wallpaper for *${query}*...`;
  const loadingMsg = await response.reply(loadingText, { parse_mode: "Markdown" });

  const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(query)}`;
  const caption = `🖼️ *${query.charAt(0).toUpperCase() + query.slice(1)}* — ${width}x${height}\n📷 Source: Unsplash`;

  try {
    // Quick probe to detect obvious failures (best-effort)
    try {
      await axios.get(unsplashUrl, { timeout: 8000, responseType: "stream", maxRedirects: 5 });
    } catch (e) {
      // proceed to attempt sending unsplashUrl anyway; fallback handled below
    }

    try { await response.delete(loadingMsg); } catch {}

    // Try sending Unsplash URL (Telegram will follow redirects)
    try {
      await response.photo(unsplashUrl, { caption, parse_mode: "Markdown" });
      return;
    } catch (e) {
      // fallback below
    }

    // Fallback: picsum.photos
    const picsumUrl = `https://picsum.photos/${width}/${height}`;
    try {
      await response.photo(picsumUrl, { caption: `${caption}\n(Fallback source)`, parse_mode: "Markdown" });
      return;
    } catch (e) {
      throw new Error("Both primary and fallback wallpaper sources failed.");
    }
  } catch (error) {
    const errText = error?.response?.status
      ? `⚠️ API error: received status ${error.response.status}`
      : `⚠️ An error occurred: ${error.message || error}`;

    try {
      await response.editText(loadingMsg, errText, { parse_mode: "Markdown" });
    } catch {
      try { await response.delete(loadingMsg); } catch {}
      await response.reply(errText, { parse_mode: "Markdown" });
    }
  }
}
