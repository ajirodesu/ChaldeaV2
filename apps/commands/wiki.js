export const meta = {
  name: "wiki",
  version: "1.0.0",
  aliases: ["wikipedia"],
  description: "Search Wikipedia and return page summary / links",
  author: "assistant",
  prefix: "both",
  category: "tools",
  type: "anyone",
  cooldown: 5,
  guide: "<search query>",
};

export async function onStart({ bot, args, response, msg, usages }) {
  if (!args.length) return usages();

  const query = args.join(" ").trim();
  // ensure fetch available (Node <18 dynamic import fallback)
  let _fetch = typeof fetch !== "undefined" ? fetch : null;
  if (!_fetch) {
    try {
      const mod = await import("node-fetch");
      _fetch = mod.default;
    } catch (e) {
      console.error("Fetch unavailable and node-fetch import failed:", e);
      return response.reply("❌ Cannot perform network requests in this environment.");
    }
  }

  try {
    const UA = { "User-Agent": "ChaldeaBot/1.0 (https://example.com)" };

    // 1) search top 5 matches
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&srlimit=5&format=json&origin=*`;
    const sres = await _fetch(searchUrl, { headers: UA });
    const sjson = await sres.json();
    const results = sjson?.query?.search || [];

    if (!results.length) return response.reply(`❌ No Wikipedia pages found for: ${query}`);

    const top = results[0];
    const title = top.title;

    // 2) fetch REST summary for top result
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const pres = await _fetch(summaryUrl, { headers: UA });

    if (!pres.ok) {
      // fallback: list top matches
      const list = results.map((r, i) => `${i + 1}. ${r.title}`).join("\n");
      return response.reply(`⚠️ Couldn't fetch page summary, but here are top matches:\n${list}`);
    }

    const pjson = await pres.json();
    const lines = [];
    lines.push(`📚 *${pjson.title || title}*`);
    if (pjson.description) lines.push(`_${pjson.description}_`);

    // disambiguation -> show top matches + link
    if (pjson.type === "disambiguation") {
      lines.push("— This is a disambiguation page. Top matches:");
      lines.push(results.map((r, i) => `${i + 1}. ${r.title}`).join("\n"));
      lines.push(`\nFull page: ${pjson.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`}`);
      return response.reply(lines.join("\n"), { parse_mode: "Markdown" });
    }

    // extract (truncate if huge)
    const EXTRACT_LIMIT = 3000;
    let extract = pjson.extract || "";
    if (extract.length > EXTRACT_LIMIT) extract = extract.slice(0, EXTRACT_LIMIT) + "\n\n[...truncated]";
    if (extract) lines.push("\n" + extract);

    // page link and optional thumbnail
    const pageUrl = pjson.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    lines.push(`\n🔗 ${pageUrl}`);
    if (pjson.thumbnail?.source) lines.push(`🖼️ Thumbnail: ${pjson.thumbnail.source}`);

    // other top matches
    if (results.length > 1) {
      lines.push("\nOther top matches:");
      lines.push(results.slice(1).map((r, i) => `${i + 2}. ${r.title}`).join("\n"));
    }

    return response.reply(lines.join("\n"), { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Wiki command error:", err);
    return response.reply(`❌ Error while searching Wikipedia:\n${err?.message || err}`);
  }
}
