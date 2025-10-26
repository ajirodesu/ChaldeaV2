import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export const meta = {
  name: "downloader",
  keyword: [
    "https://vt.tiktok.com",
    "https://www.tiktok.com/",
    "https://www.facebook.com",
    "https://www.instagram.com/",
    "https://youtu.be/",
    "https://youtube.com/",
    "https://x.com/",
    "https://twitter.com/",
    "https://vm.tiktok.com",
    "https://fb.watch",
  ],
  aliases: [],
  version: "1.0.1",
  author: "Dipto",
  description: "Auto downloads videos from social media platforms.",
  guide: ["[video_link]"],
  cooldown: 0,
  type: "anyone",
  category: "downloader",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, "..", "temp");
fs.mkdirSync(tempDir, { recursive: true });

export async function onStart({ response }) {
  await response.reply("Send a video link, and I'll download it for you!", { parse_mode: "HTML" });
}

export async function onWord({ msg, chatId, response }) {
  const text = (msg.text || msg.caption || "").trim();
  const found = meta.keyword.find((k) => text.includes(k));
  if (!found) return;

  let waitId = null;
  const wait = await response.reply("⏳ Processing your request...", { noReply: true });
  waitId = wait?.message_id;

  try {
    const apiUrl = `${global.api.dipto}/alldl?url=${encodeURIComponent(text)}`;
    const { data: apiData } = await axios.get(apiUrl).catch((e) => { throw new Error("Download API error: " + (e.message || e)); });
    if (!apiData?.result) throw new Error("Download API returned no result.");

    const downloadUrl = apiData.result;
    const { data: videoBuf } = await axios.get(downloadUrl, { responseType: "arraybuffer" });

    const filePath = path.join(tempDir, `downloaded_${Date.now()}.mp4`);
    fs.writeFileSync(filePath, Buffer.from(videoBuf));

    try { if (waitId) await response.delete({ chatId, messageId: waitId }); } catch (_) {}

    await response.video(fs.createReadStream(filePath), {
      caption: `${apiData.cp || ""} ✅`,
      filename: "video.mp4",
      contentType: "video/mp4",
      noReply: true,
    });

    try { fs.unlinkSync(filePath); } catch (_) {}
  } catch (err) {
    try { if (waitId) await response.delete({ chatId, messageId: waitId }); } catch (_) {}
    await response.reply(`❎ Error: ${err?.message || String(err)}`);
  }
}
