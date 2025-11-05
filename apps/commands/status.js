import os from "os";

export const meta = {
  name: "status",
  version: "1.0.0",
  aliases: ["stats", "botinfo"],
  description: "Displays comprehensive real-time bot and server information",
  author: "Francis Loyd Raval",
  prefix: "both",
  category: "Utility",
  type: "anyone",
  cooldown: 5,
  guide: ["(no args)"],
};

function formatUptime(seconds) {
  let yrs = Math.floor(seconds / (365 * 24 * 60 * 60));
  seconds %= 365 * 24 * 60 * 60;
  let days = Math.floor(seconds / (24 * 60 * 60));
  seconds %= 24 * 60 * 60;
  let hours = Math.floor(seconds / (60 * 60));
  seconds %= 60 * 60;
  let minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);

  const parts = [];
  if (yrs > 0) parts.push(`${yrs} year${yrs > 1 ? "s" : ""}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds > 0 || parts.length === 0)
    parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

  if (parts.length > 1) {
    const last = parts.pop();
    parts.push(`and ${last}`);
  }

  return parts.join(parts.length > 2 ? ", " : " ");
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export async function onStart({ response }) {
  const start = Date.now();

  const uptimeSeconds = process.uptime();
  const startedAt = new Date(Date.now() - uptimeSeconds * 1000).toLocaleString();

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const processMem = process.memoryUsage();
  const rss = formatBytes(processMem.rss);
  const heapUsed = formatBytes(processMem.heapUsed);
  const heapTotal = formatBytes(processMem.heapTotal);
  const external = formatBytes(processMem.external ?? 0);
  const arrayBuffers = formatBytes(processMem.arrayBuffers ?? 0);

  const platform = `${os.platform()} ${os.arch()} (${os.release()})`;
  const cpus = os.cpus() || [];
  const cpuModel = cpus.length ? cpus[0].model.trim() : "Unknown";
  const cpuCores = cpus.length || 0;
  const cpuLoad = os.loadavg();
  const nodeVer = process.version;
  const pid = process.pid;

  const serverTime = new Date().toLocaleString("en-US", {
    timeZoneName: "short",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const ping = Date.now() - start;
  const botUptime = formatUptime(uptimeSeconds);
  const systemUptime = formatUptime(os.uptime());

  const info = [
    "*🤖 Bot Status*",
    `• *Uptime*: ${botUptime}`,
    `• *Started*: ${startedAt}`,
    `• *Ping*: ${ping}ms`,
    `• *Server Time*: ${serverTime}`,
    "",
    "*💻 System*",
    `• *Platform*: ${platform}`,
    `• *CPU*: ${cpuModel} (${cpuCores} cores)`,
    `• *Load Avg (1/5/15)*: ${cpuLoad[0].toFixed(2)}, ${cpuLoad[1].toFixed(2)}, ${cpuLoad[2].toFixed(2)}`,
    `• *System Uptime*: ${systemUptime}`,
    `• *Node.js*: ${nodeVer}`,
    `• *PID*: ${pid}`,
    "",
    "*🧠 Memory (RAM)*",
    `• *Total*: ${formatBytes(totalMem)}`,
    `• *Used*: ${formatBytes(usedMem)} (${((usedMem / totalMem) * 100).toFixed(1)}%)`,
    `• *Free*: ${formatBytes(freeMem)}`,
    "",
    "*📦 Process Memory*",
    `• *RSS*: ${rss}`,
    `• *Heap Used*: ${heapUsed} / ${heapTotal}`,
    `• *External*: ${external}`,
    `• *Array Buffers*: ${arrayBuffers}`,
    "",
    "*⚙️ Environment*",
    `• *Hostname*: ${os.hostname()}`,
    `• *User*: ${os.userInfo().username}`,
    `• *Home Dir*: ${os.homedir()}`,
    `• *Temp Dir*: ${os.tmpdir()}`,
  ].join("\n");

  await response.reply(info.trim(), { parse_mode: "Markdown" });
}
