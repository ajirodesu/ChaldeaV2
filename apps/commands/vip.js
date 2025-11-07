import fs from 'fs';
import path from 'path';

export const meta = {
  name: 'vip',
  version: '1.0.4',
  description: 'Manage VIP users (list/add/remove)',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'utility',
  type: 'anyone',
  cooldown: 2,
  guide: [
    '- show this guide',
    'list - list VIPs',
    'add <uid> - add VIP (or reply)',
    'remove <uid> - remove VIP (or reply)'
  ]
};

// Constants
const VIP_PATH = global.vipPath;
const SETTINGS_PATH = global.settingsPath;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Ensures the directory for a file path exists
 * @param {string} filePath - File path to ensure directory for
 */
const ensureDirectory = (filePath) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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
// VIP Data Management
// ============================================================================

/**
 * Loads VIP data from file, creates default if not exists
 * @returns {Object} VIP data object with uid array
 */
const loadVipData = () => {
  try {
    if (!fs.existsSync(VIP_PATH)) {
      return createDefaultVipData();
    }

    const data = JSON.parse(fs.readFileSync(VIP_PATH, 'utf8'));

    // Ensure uid is always an array
    if (!Array.isArray(data.uid)) {
      data.uid = [];
    }

    return data;
  } catch (error) {
    console.error('Error loading VIP data:', error.message);
    return createDefaultVipData();
  }
};

/**
 * Creates and saves default VIP data
 * @returns {Object} Default VIP data object
 */
const createDefaultVipData = () => {
  ensureDirectory(VIP_PATH);
  const defaultData = { uid: [] };
  fs.writeFileSync(VIP_PATH, JSON.stringify(defaultData, null, 2));
  return defaultData;
};

/**
 * Saves VIP data to file
 * @param {Object} vipData - VIP data object to save
 */
const saveVipData = (vipData) => {
  const existing = fs.existsSync(VIP_PATH)
    ? JSON.parse(fs.readFileSync(VIP_PATH, 'utf8'))
    : {};

  existing.uid = Array.isArray(vipData.uid) ? vipData.uid : [];
  fs.writeFileSync(VIP_PATH, JSON.stringify(existing, null, 2));
};

/**
 * Checks if a user is a VIP
 * @param {Object} vipData - VIP data object
 * @param {string|number} userId - User ID to check
 * @returns {boolean} True if user is VIP
 */
const isVip = (vipData, userId) => {
  if (!vipData?.uid) return false;
  const normalizedId = normalizeId(userId);
  return vipData.uid.map(String).includes(normalizedId);
};

// ============================================================================
// Owner Management
// ============================================================================

/**
 * Loads owner list from settings file
 * @returns {Array|null} Array of owner IDs or null if unavailable
 */
const loadOwners = () => {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      console.warn('Settings file not found:', SETTINGS_PATH);
      return null;
    }

    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    return Array.isArray(settings.owner) ? settings.owner.map(String) : [];
  } catch (error) {
    console.error('Error loading owners:', error.message);
    return null;
  }
};

/**
 * Checks if a user is an owner
 * @param {Array|null} ownerArray - Array of owner IDs
 * @param {string|number} userId - User ID to check
 * @returns {boolean} True if user is owner
 */
const isOwner = (ownerArray, userId) => {
  if (!Array.isArray(ownerArray)) return false;
  const normalizedId = normalizeId(userId);
  return ownerArray.map(String).includes(normalizedId);
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
 * Builds a formatted VIP list
 * @param {Object} bot - Bot instance
 * @param {Object} vipData - VIP data object
 * @returns {Promise<string>} Formatted VIP list
 */
const buildVipList = async (bot, vipData) => {
  if (!vipData?.uid?.length) {
    return `👑 No VIPs set.\n\nVIP file: \`${VIP_PATH}\``;
  }

  const entries = await Promise.all(
    vipData.uid.map(async (id, index) => {
      const { name, id: uid } = await getUserDisplay(bot, id);
      const displayName = name || `\`${uid}\``;
      return `${index + 1}. ${displayName}`;
    })
  );

  return `👑 *VIP list:*\n\n${entries.join('\n')}`;
};

// ============================================================================
// Command Handlers
// ============================================================================

/**
 * Handles the 'list' subcommand
 */
const handleList = async (bot, vipData, response) => {
  const list = await buildVipList(bot, vipData);
  return response.reply(list, { parse_mode: 'Markdown' });
};

/**
 * Handles 'add' and 'remove' subcommands
 */
const handleAddRemove = async (bot, msg, args, response, vipData, owners, action) => {
  // Verify owner permissions
  if (!Array.isArray(owners)) {
    return response.reply(
      `⚠️ Cannot verify owner: settings file missing/invalid at \`${SETTINGS_PATH}\`.`,
      { parse_mode: 'Markdown' }
    );
  }

  const requesterId = msg.from?.id ?? msg.from?.user_id;
  if (!isOwner(owners, requesterId)) {
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

  // Check current VIP status
  const isCurrentlyVip = isVip(vipData, targetId);
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
    if (isCurrentlyVip) {
      return response.reply(
        `ℹ️ User ${userLabel} is already a VIP.`,
        { parse_mode: 'Markdown' }
      );
    }
    // Add and deduplicate
    vipData.uid = [...new Set([...vipData.uid, targetId].map(String))];
  }
  // Handle remove action
  else {
    if (!isCurrentlyVip) {
      return response.reply(
        `ℹ️ User ${userLabel} is not a VIP.`,
        { parse_mode: 'Markdown' }
      );
    }
    vipData.uid = vipData.uid.filter(id => String(id) !== targetId);
  }

  // Save changes
  try {
    saveVipData(vipData);
    const actionText = action === 'add' ? 'Added' : 'Removed';
    return response.reply(
      `✅ ${actionText} VIP: ${userLabel}.`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error saving VIP data:', error);
    return response.reply(
      `⚠️ Failed to save VIP file: ${error.message}`,
      { parse_mode: 'Markdown' }
    );
  }
};

// ============================================================================
// Main Command Handler
// ============================================================================

/**
 * Main entry point for the VIP command
 */
export async function onStart({ bot, msg, args, response, usages }) {
  const vipData = loadVipData();
  const owners = loadOwners();

  // Show usage guide if no arguments
  if (!args.length) {
    return usages();
  }

  const subcommand = args[0].toLowerCase();

  // Route to appropriate handler
  switch (subcommand) {
    case 'list':
      return handleList(bot, vipData, response);

    case 'add':
    case 'remove':
      return handleAddRemove(bot, msg, args, response, vipData, owners, subcommand);

    default:
      const defaultGuide = meta.guide.join('\n');
      return response.reply(
        defaultGuide || '⚠️ Invalid subcommand.',
        { parse_mode: 'Markdown' }
      );
  }
}