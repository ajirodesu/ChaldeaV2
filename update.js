import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), 'utf8'));
const SCRIPT_NAME = packageJson.name || "bot-updater";
const SCRIPT_VERSION = packageJson.version || "unknown";

const PROJECT_DIR = path.resolve(__dirname);

const LOG_PREFIX = {
  INFO: "[INFO]",
  WARN: "[WARN]",
  ERROR: "[ERROR]",
  EXEC: "[EXEC]",
};

function log(level, message) {
  console.log(`${LOG_PREFIX[level]} ${message}`);
}

const updateConfigPath = path.join(__dirname, "setup", "update.json");
let updateConfig;
try {
  const configData = fs.readFileSync(updateConfigPath, "utf8");
  updateConfig = JSON.parse(configData);
} catch (error) {
  log("ERROR", `Failed to read or parse update.json: ${error.message}`);
  process.exit(1);
}

if (!updateConfig.repository || typeof updateConfig.repository !== "string") {
  log("ERROR", "Missing or invalid 'repository' in update.json");
  process.exit(1);
}
if (!updateConfig.branch || typeof updateConfig.branch !== "string") {
  log("ERROR", "Missing or invalid 'branch' in update.json");
  process.exit(1);
}
if (!updateConfig.preserve || !Array.isArray(updateConfig.preserve)) {
  log("ERROR", "Missing or invalid 'preserve' in update.json");
  process.exit(1);
}
if (!updateConfig.backup || typeof updateConfig.backup !== "string") {
  log("ERROR", "Missing or invalid 'backup' in update.json");
  process.exit(1);
}

const CONFIG = {
  repoUrl: updateConfig.repository,
  branch: updateConfig.branch,
  preserveDirs: updateConfig.preserve,
  backupDir: path.join(PROJECT_DIR, updateConfig.backup),
};

function runCommand(command, errorMessage = `Failed to execute '${command}'`) {
  try {
    const output = execSync(command, { cwd: PROJECT_DIR, stdio: "inherit" });
    log("EXEC", command);
    return output ? output.toString().trim() : "";
  } catch (error) {
    const message = `${errorMessage}: ${error.message}`;
    log("ERROR", message);
    throw new Error(message);
  }
}

function isGitInstalled() {
  try {
    runCommand("git --version", "Git is not installed on this system");
    return true;
  } catch (error) {
    log("ERROR", error.message);
    return false;
  }
}

export async function updateBot() {
  log("INFO", `Starting ${SCRIPT_NAME} update (Version: ${SCRIPT_VERSION})...`);

  try {
    if (!isGitInstalled()) {
      throw new Error("Git is not installed. Please install Git and try again.");
    }

    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
      log("INFO", `Created backups directory: ${CONFIG.backupDir}`);
    }

    const backups = {};
    for (const dir of CONFIG.preserveDirs) {
      const fullDir = path.join(PROJECT_DIR, dir);
      if (fs.existsSync(fullDir)) {
        const backupPath = path.join(CONFIG.backupDir, `${dir}_backup_${Date.now()}`);
        fs.cpSync(fullDir, backupPath, { recursive: true });
        backups[dir] = backupPath;
        log("INFO", `Backed up ${dir} to ${backupPath}`);
      } else {
        log("INFO", `No ${dir} folder found to back up.`);
      }
    }

    try {
      runCommand("git diff --quiet && git diff --staged --quiet", "Failed to check Git status");
    } catch (error) {
      log("WARN", "Uncommitted changes detected. These will be overwritten.");
    }

    runCommand(
      "git rev-parse --is-inside-work-tree || git init",
      "Failed to initialize or verify Git repository"
    );
    runCommand(
      `git remote set-url origin ${CONFIG.repoUrl} || git remote add origin ${CONFIG.repoUrl}`,
      "Failed to set Git remote origin"
    );
    runCommand("git fetch origin", "Failed to fetch from remote repository");
    runCommand(
      `git reset --hard origin/${CONFIG.branch}`,
      `Failed to reset to latest ${CONFIG.branch} branch`
    );

    for (const [dir, backupPath] of Object.entries(backups)) {
      const fullDir = path.join(PROJECT_DIR, dir);
      fs.rmSync(fullDir, { recursive: true, force: true });
      fs.cpSync(backupPath, fullDir, { recursive: true });
      fs.rmSync(backupPath, { recursive: true, force: true });
      log("INFO", `Restored original ${dir} from ${backupPath}`);
    }

    try {
      runCommand("npm install", "Failed to install NPM dependencies");
    } catch (error) {
      throw new Error(`Dependency installation failed: ${error.message}. Update aborted.`);
    }

    log("INFO", `${SCRIPT_NAME} updated successfully.`);
  } catch (error) {
    log("ERROR", `Update process failed: ${error.message}`);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateBot().catch((error) => {
    log("ERROR", `Unhandled error: ${error.message}`);
    process.exit(1);
  });
}
