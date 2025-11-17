import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

export const meta = {
  name: 'shell',
  version: '1.0.0',
  aliases: ['terminal', 'bash'],
  description: 'Execute shell or terminal commands on the server.',
  author: 'AjiroDesu',
  prefix: 'both',
  category: 'dev',
  type: 'dev',
  cooldown: 5,
  guide: ['<command> - Run a shell/terminal command on the host server.']
};

export async function onStart({ bot, msg, args, response, usages }) {
  const command = args.join(' ');
  if (!command) {
    return usages();
  }

  const loadingMsg = await response.reply('💻 *Executing command...*', { parse_mode: 'Markdown' });

  try {
    const { stdout, stderr } = await execPromise(command);

    const output = stdout || stderr || '✅ Command executed successfully but no output.';
    const formattedOutput = output.length > 4000
      ? output.slice(0, 4000) + '\n\n⚠️ Output truncated.'
      : output;

    await response.editText(loadingMsg, `🧩 *Command:*\n\`${command}\`\n\n📤 *Output:*\n\`\`\`\n${formattedOutput}\n\`\`\``, { parse_mode: 'Markdown' });

  } catch (error) {
    await response.editText(loadingMsg, `❌ *Error executing command:*\n\`\`\`\n${error.message}\n\`\`\``, { parse_mode: 'Markdown' });
  }
}
