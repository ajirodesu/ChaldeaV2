import fs from 'fs';
import path from 'path';
import { scriptsUtils } from './utility/scriptsUtils.js';
import { login } from './system/login.js';
import startServer from './server.js';

const settingsPath = path.join(process.cwd(), 'setup/settings.json');
const vipPath = path.join(process.cwd(), 'setup/vip.json');
const apiPath = path.join(process.cwd(), 'setup/api.json');
const statesPath = path.join(process.cwd(), 'setup/states.json');

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const vip = JSON.parse(fs.readFileSync(vipPath, 'utf8'));
const api = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
const states = JSON.parse(fs.readFileSync(statesPath, 'utf8'));

global.settings = settings;
global.vip = vip;
global.api = api;
global.states = states;

global.chaldea = {
  commands: new Map(),
  cooldowns: new Map(),
  replies: new Map(),
  callbacks: new Map(),
  events: new Map()
};

global.scripts = scriptsUtils;

await scriptsUtils();

login();
startServer();
