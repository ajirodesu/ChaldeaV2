import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'owner',
  version: '1.0.5',
  description: 'Manage bot owners (list/add/remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'owner',
  type: 'anyone',
  cooldown: 2,
  guide: [
    '- show this guide',
    'list - list owners',
    'add <uid> - add owner (or reply)',
    'remove <uid> - remove owner (or reply)'
  ]
};

// Constants
const SETTINGS_PATH = global.settingsPath;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Ensures the settings directory exists
 */
const ensureDirectory = () => {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
};

/**
 * Normalizes user ID to string format
 * @param {string|number} id - User ID to normalize
 * @returns {string|null} Normalized ID or null
 */
const normalizeId = (id) => {
  if (!id) return null;
  const match = String(id).match(/-?\d+/);
  return match ? match[0] : null;
};

/**
 * Builds a display name for a user
 * @param {Object} user - User object with name/username fields
 * @returns {string|null} Formatted user display name
 */
const buildUserName = (user) => {
  if (!user) return null;

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  const baseName = fullName || (user.username ? `@${user.username}` : null);

  if (!baseName) return null;

  // Add username if it's not already in the name
  return user.username && !baseName.includes(user.username)
    ? `${baseName} (@${user.username})`
    : baseName;
};

// ============================================================================
// Settings Management
// ============================================================================

/**
 * Loads settings from file, creates default if not exists
 * @returns {Object} Settings object with owner array
 */
const loadSettings = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      return createDefaultSettings();
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));

    // Ensure owner is always an array
    if (!Array.isArray(settings.owner)) {
      settings.owner = [];
    }

    return settings;
  } catch (error) {
    console.error('Error loading settings:', error.message);
    return createDefaultSettings();
  }
};

/**
 * Creates and saves default settings
 * @returns {Object} Default settings object
 */
const createDefaultSettings = () => {
  ensureDirectory();
  const defaultSettings = { owner: [] };
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultSettings, null, 2));
  return defaultSettings;
};

/**
 * Saves settings to file
 * @param {Object} settings - Settings object to save
 */
const saveSettings = (settings) => {
  const existing = fs.existsSync(SETTINGS_PATH)
    ? JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'))
    : {};

  existing.owner = Array.isArray(settings.owner) ? settings.owner : [];
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(existing, null, 2));
};

/**
 * Checks if a user is an owner
 * @param {Object} settings - Settings object
 * @param {string|number} userId - User ID to check
 * @returns {boolean} True if user is owner
 */
const isOwner = (settings, userId) => {
  if (!settings?.owner) return false;
  const normalizedId = normalizeId(userId);
  return settings.owner.map(String).includes(normalizedId);
};

// ============================================================================
// User Display Functions
// ============================================================================

/**
 * Gets user display information
 * @param {Object} bot - Bot instance
 * @param {string|number} userId - User ID
 * @param {Object|null} userObj - Optional user object
 * @returns {Promise<Object>} Object with name and id properties
 */
const getUserDisplay = async (bot, userId, userObj = null) => {
  const uid = normalizeId(userId);
  if (!uid) return { name: null, id: null };

  // Try to use provided user object first
  if (userObj) {
    const name = buildUserName(userObj);
    if (name) return { name, id: uid };
  }

  // Fetch from API as fallback
  try {
    const chat = await bot.getChat(uid);
    const name = buildUserName(chat);
    return { name, id: uid };
  } catch (error) {
    return { name: null, id: uid };
  }
};

/**
 * Builds a formatted owner list
 * @param {Object} bot - Bot instance
 * @param {Object} settings - Settings object
 * @returns {Promise<string>} Formatted owner list
 */
const buildOwnerList = async (bot, settings) => {
  if (!settings?.owner?.length) {
    return `👑 No owners set.\n\nSettings: \`${SETTINGS_PATH}\``;
  }

  const entries = await Promise.all(
    settings.owner.map(async (id, index) => {
      const { name, id: uid } = await getUserDisplay(bot, id);
      const displayName = name || `\`${uid}\``;
      return `${index + 1}. ${displayName}`;
    })
  );

  return `👑 *Owner list:*\n\n${entries.join('\n')}`;
};

// ============================================================================
// Command Handlers
// ============================================================================

/**
 * Handles the 'list' subcommand
 */
const handleList = async (bot, settings, response) => {
  const list = await buildOwnerList(bot, settings);
  return response.reply(list, { parse_mode: 'Markdown' });
};

/**
 * Handles 'add' and 'remove' subcommands
 */
const handleAddRemove = async (bot, msg, args, response, settings, action) => {
  // Verify permissions
  const requesterId = msg.from?.id ?? msg.from?.user_id;
  if (!isOwner(settings, requesterId)) {
    return response.reply(
      '⚠️ Only owners can use this command.',
      { parse_mode: 'Markdown' }
    );
  }

  // Get target user
  const targetId = normalizeId(msg.reply_to_message?.from?.id ?? args[1]);
  if (!targetId) {
    return response.reply(
      `⚠️ Missing target. Use \`${action} <uid>\` or reply to a message.`,
      { parse_mode: 'Markdown' }
    );
  }

  // Check current status
  const isCurrentlyOwner = isOwner(settings, targetId);
  const display = await getUserDisplay(
    bot,
    targetId,
    msg.reply_to_message?.from
  );
  const userLabel = display.name
    ? `${display.name} (\`${display.id}\`)`
    : `\`${display.id}\``;

  // Handle add action
  if (action === 'add') {
    if (isCurrentlyOwner) {
      return response.reply(
        `ℹ️ User ${userLabel} is already an owner.`,
        { parse_mode: 'Markdown' }
      );
    }
    // Add and deduplicate
    settings.owner = [...new Set([...settings.owner, targetId].map(String))];
  }
  // Handle remove action
  else {
    if (!isCurrentlyOwner) {
      return response.reply(
        `ℹ️ User ${userLabel} is not an owner.`,
        { parse_mode: 'Markdown' }
      );
    }
    settings.owner = settings.owner.filter(id => String(id) !== targetId);
  }

  // Save changes
  try {
    saveSettings(settings);
    const actionText = action === 'add' ? 'Added' : 'Removed';
    return response.reply(
      `✅ ${actionText} owner: ${userLabel}.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error saving settings:', error);
    return response.reply(
      `⚠️ Failed to save settings: ${error.message}`,
      { parse_mode: 'Markdown' }
    );
  }
};

// ============================================================================
// Main Command Handler
// ============================================================================

/**
 * Main entry point for the owner command
 */
export async function onStart({ bot, msg, args, response, usages }) {
  const settings = loadSettings();

  // Show usage guide if no arguments
  if (!args.length) {
    return usages();
  }


  const subcommand = args[0].toLowerCase();

  // Route to appropriate handler
  switch (subcommand) {
    case 'list':
      return handleList(bot, settings, response);

    case 'add':
    case 'remove':
      return handleAddRemove(bot, msg, args, response, settings, subcommand);

    default:
      const defaultGuide = meta.guide.join('\n');
      return response.reply(
        defaultGuide || '⚠️ Invalid subcommand.',
        { parse_mode: 'Markdown' }
      );
  }
}