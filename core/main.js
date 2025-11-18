// main.js
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import * as log from './utility/log.js';
import { scripts } from './utility/scripts.js';
import { login } from './system/login.js';
import { webview } from './webview.js';
console.log(chalk.blue('LOADING MAIN SYSTEM'));
const settingsPath = path.join(process.cwd(), 'setup/settings.json');
const vipPath = path.join(process.cwd(), 'setup/vip.json');
const apiPath = path.join(process.cwd(), 'setup/api.json');
const statesPath = path.join(process.cwd(), 'setup/states.json');
const notifPath = path.join(process.cwd(), 'setup/notification.json');
let settings, vip, api, states, notif;
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  log.chaldea('Loaded settings.json', 'chaldea');
  vip = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
  log.chaldea('Loaded vip.json', 'chaldea');
  api = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
  log.chaldea('Loaded api.json', 'chaldea');
  states = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
  log.chaldea('Loaded states.json', 'chaldea');
  notif = JSON.parse(fs.readFileSync(notifPath, 'utf8'));
  log.chaldea('Loaded notification.json', 'chaldea');
  console.log('');
} catch (error) {
  log.default(`Error loading configuration files: ${error.message}`, 'err');
  process.exit(1);
}
global.settingsPath = settingsPath;
global.vipPath = vipPath;
global.statesPath = statesPath;
global.settings = settings;
global.vip = vip;
global.api = api;
global.states = states;
global.notif = notif;
global.chaldea = {
  commands: new Map(),
  cooldowns: new Map(),
  replies: new Map(),
  callbacks: new Map(),
  events: new Map(),
  instances: new Map(),
  keys: new Set()
};
// Initialize everything
(async () => {
  try {
    await scripts(log);
    global.scripts = scripts;
    global.bots = login(log);
    webview(log);
  } catch (error) {
    log.default(`Error during initialization: ${error.message}`, 'err');
    console.error(error);
    process.exit(1);
  }
})();