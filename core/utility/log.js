// core/utility/log.js
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve config relative to project root (keeps the same behavior as using './core/utility/config.json')
const configPath = path.join(process.cwd(), 'core', 'utility', 'config.json');

const configLog = JSON.parse(fs.readFileSync(configPath, 'utf8'));

export default function log(logMsg, type) {
  switch (type) {
    case 'load':
      console.log(`${chalk.blue(configLog.load)} - ${logMsg}`);
      break;
    case 'err':
      console.log(`${chalk.red(configLog.err)} - ${logMsg}`); // Fixed: use configLog.err
      break;
    case 'warn':
      console.warn(`${chalk.yellow(configLog.warn)} - ${logMsg}`);
      break;
    case 'login':
      console.log(`${chalk.blue(configLog.login)} - ${logMsg}`);
      break;
    case 'cmd':
      console.log(`${chalk.blue(configLog.cmd)} - ${logMsg}`);
      break;
    case 'evnts':
      console.log(`${chalk.blue(configLog.evnts)} - ${logMsg}`);
      break;
    default:
      console.log(`${chalk.blue(configLog.load)} - ${logMsg}`);
      break;
  }
}

export function chaldea(message) {
  console.log(`${chalk.blue(configLog.chaldea)} - ${message}`);
}

export function commands(message) {
  console.log(`${chalk.blue(configLog.cmd)} - ${message}`);
}

export function events(message) {
  console.log(`${chalk.blue(configLog.evnts)} - ${message}`);
}

export function login(message) {
  console.log(`${chalk.blue(configLog.login)} - ${message}`);
}

export function error(message) {
  console.log(`${chalk.red(configLog.err)} - ${message}`); // Fixed: use configLog.err
}

export function database(message) {
  console.log(`${chalk.blue('database')} - ${message}`);
}

export function update(message) {
  console.log(`${chalk.blue('update')} - ${message}`);
}

export function backup(message) {
  console.log(`${chalk.blue('backup')} - ${message}`);
}

export function download(message) {
  console.log(`${chalk.blue('download')} - ${message}`);
}

export function install(message) {
  console.log(`${chalk.blue('install')} - ${message}`);
}