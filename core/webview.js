// webview.js
import express from 'express';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import session from 'express-session';
import TelegramBot from 'node-telegram-bot-api';
import { listen } from './listen.js';

export function webview(log) {
  console.log('');
  console.log(chalk.blue('LOADING SERVER SYSTEM'));

  const app = express();
  const port = process.env.PORT || 3000;

  app.disable("x-powered-by");

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: 'chaldea-dashboard-secret',  // Change to a secure secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 3600000 }  // 1 hour session
  }));

  // Auth middleware
  function authCheck(req, res, next) {
    if (req.session.authenticated) {
      next();
    } else {
      res.redirect('/');
    }
  }

  // Define paths
  const publicPath = path.join(process.cwd(), 'core', 'public');
  const introPath = path.join(publicPath, 'index.html');  // Intro/login
  const dashboardPath = path.join(publicPath, 'dashboard.html');
  const commandsPath = path.join(publicPath, 'commands.html');
  const eventsPath = path.join(publicPath, 'events.html');
  const tokensPath = path.join(publicPath, 'tokens.html');
  const commonJsPath = path.join(publicPath, 'assets', 'common.js');
  const commonCssPath = path.join(publicPath, 'assets', 'common.css');

  // Routes
  app.get('/', (req, res) => {
    if (req.session.authenticated) {
      res.redirect('/dashboard.html');
    } else {
      res.sendFile(introPath);
    }
  });

  app.get('/dashboard.html', authCheck, (req, res) => {
    res.sendFile(dashboardPath);
  });

  app.get('/commands.html', authCheck, (req, res) => {
    res.sendFile(commandsPath);
  });

  app.get('/events.html', authCheck, (req, res) => {
    res.sendFile(eventsPath);
  });

  app.get('/tokens.html', authCheck, (req, res) => {
    res.sendFile(tokensPath);
  });

  app.get('/common.js', (req, res) => {
    res.sendFile(commonJsPath);
  });

  app.get('/common.css', (req, res) => {
    res.sendFile(commonCssPath);
  });

  // Validate key endpoint
  app.post("/api/validate-key", (req, res) => {
    const { key } = req.body;
    if (!key || !global.states.dashboardKeys.has(key)) {
      return res.json({ success: false, error: 'Invalid key' });
    }

    // Validate and remove key (one-time use)
    global.states.dashboardKeys.delete(key);
    req.session.authenticated = true;
    res.json({ success: true });
  });

  // API Endpoints

  // Bot information endpoint
  app.get("/api/bot-info", (req, res) => {
    try {
      const tokens = global.states.tokens || [];
      const commands = Array.from(global.chaldea.commands.values()).map(cmd => ({
        name: cmd.meta.name,
        aliases: cmd.meta.aliases || [],
        description: cmd.meta.description || 'No description',
        usage: cmd.meta.usage || `${global.settings.prefix}${cmd.meta.name}`,
        category: cmd.meta.category || 'general'
      }));

      const events = Array.from(global.chaldea.events.values()).map(evt => ({
        name: evt.meta.name,
        description: evt.meta.description || 'No description'
      }));

      res.json({
        botCount: tokens.length,
        commandCount: commands.length,
        eventCount: events.length,
        settings: {
          prefix: global.settings.prefix,
          developer: global.settings.developer,
          timezone: global.settings.timeZone
        },
        uptime: {
          seconds: process.uptime(),
          human: convertTime(process.uptime() * 1000)
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Commands endpoint
  app.get("/api/commands", (req, res) => {
    try {
      const commands = Array.from(global.chaldea.commands.values()).map(cmd => ({
        name: cmd.meta.name,
        aliases: cmd.meta.aliases || [],
        description: cmd.meta.description || 'No description',
        usage: cmd.meta.usage || `${global.settings.prefix}${cmd.meta.name}`,
        category: cmd.meta.category || 'general',
        cooldown: cmd.meta.cooldown || 0
      }));

      // Group by category
      const grouped = commands.reduce((acc, cmd) => {
        const cat = cmd.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(cmd);
        return acc;
      }, {});

      res.json({ commands: grouped, total: commands.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Events endpoint
  app.get("/api/events", (req, res) => {
    try {
      const events = Array.from(global.chaldea.events.values()).map(evt => ({
        name: evt.meta.name,
        description: evt.meta.description || 'No description',
        type: evt.meta.type || 'message'
      }));

      res.json({ events, total: events.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Token management
  app.get("/api/tokens", (req, res) => {
    try {
      const tokens = global.states.tokens.map((token, index) => ({
        id: index,
        token: token.substring(0, 20) + '...' + token.slice(-10),
        fullToken: token
      }));
      res.json({ tokens });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tokens", async (req, res) => {
    const { token } = req.body;
    if (!token || !token.includes(':')) {
      return res.status(400).json({ error: 'Invalid token format' });
    }

    try {
      global.states.tokens.push(token);
      const statesPath = path.join(process.cwd(), 'setup', 'states.json');
      await fs.writeJson(statesPath, global.states, { spaces: 2 });

      // Dynamically initialize new bot
      const newBot = new TelegramBot(token, { polling: true });
      newBot.index = global.bots.length;
      newBot.totalBots = global.bots.length + 1;
      listen(newBot, log);
      global.bots.push(newBot);

      // Update totalBots on existing bots
      global.bots.forEach(b => {
        b.totalBots = global.bots.length;
      });

      res.json({ success: true, message: 'Token added and bot session refreshed successfully.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tokens/:index", async (req, res) => {
    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= global.states.tokens.length) {
      return res.status(400).json({ error: 'Invalid token index' });
    }

    try {
      // Stop and remove bot
      const botToRemove = global.bots[index];
      if (botToRemove) {
        botToRemove.stopPolling();
      }
      global.bots.splice(index, 1);

      // Update indices and totalBots
      global.bots.forEach((b, i) => {
        b.index = i;
        b.totalBots = global.bots.length;
      });

      global.states.tokens.splice(index, 1);
      const statesPath = path.join(process.cwd(), 'setup', 'states.json');
      await fs.writeJson(statesPath, global.states, { spaces: 2 });
      res.json({ success: true, message: 'Token removed and bot session refreshed successfully.' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/restart", (req, res) => {
    res.json({ message: 'Restarting bot...' });
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP" });
  });

  // Uptime
  app.get("/uptime", (req, res) => {
    res.json({
      uptime: process.uptime(),
      uptimeHuman: convertTime(process.uptime() * 1000)
    });
  });

  // Start server
  app.listen(port, "0.0.0.0", () => {
    log.chaldea(`Chaldea Bot server is running on port ${port}`, 'chaldea');
  });

  return app;
}

function convertTime(ms) {
  const sec = Math.floor((ms / 1000) % 60);
  const min = Math.floor((ms / (1000 * 60)) % 60);
  const hr = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return `${days}d ${hr}h ${min}m ${sec}s`;
}