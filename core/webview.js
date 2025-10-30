// webview.js
import express from 'express';

export function webview() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.disable("x-powered-by");

  // Endpoint from code 1: Root route
  app.get("/", (req, res) => {
    res.send("Chaldea Bot is running!");
  });

  // Endpoint from code 1: Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP" });
  });

  // Endpoint from code 2: Uptime
  app.get("/uptime", (req, res) => {
    res.json({
      uptime: process.uptime(),
      uptimeHuman: convertTime(process.uptime() * 1000)
    });
  });

  // Start server
  app.listen(port, "0.0.0.0", () => {
    console.log(`Chaldea Bot server is running on port ${port}`);
  });

  return app;
}

// Uptime conversion function from code 2
function convertTime(ms) {
  const sec = Math.floor((ms / 1000) % 60);
  const min = Math.floor((ms / (1000 * 60)) % 60);
  const hr = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hr}h ${min}m ${sec}s`;
}
