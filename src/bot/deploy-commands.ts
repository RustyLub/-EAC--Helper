import { InteractionContextType, REST, Routes } from 'discord.js';
import 'dotenv/config';
import { commands as commandModules } from './registry';

const commands = commandModules.flatMap((command) => {
  if ('data' in command && 'execute' in command) {
    // Все команды работают только на серверах: в личных сообщениях бот не хранит состояния сервера.
    return [{ ...command.data.toJSON(), contexts: [InteractionContextType.Guild] }];
  }
  console.warn('[Bot] A command is missing required data or execute properties.');
  return [];
});

export async function deployCommands() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.CLIENT_ID;
  if (!token || token === 'YOUR_DISCORD_BOT_TOKEN') {
    console.warn('[Bot] DISCORD_TOKEN is missing; skipping slash-command registration.');
    return;
  }
  if (!clientId || clientId.startsWith('YOUR_') || !/^\d{17,20}$/.test(clientId)) {
    throw new Error('[Bot] CLIENT_ID is missing or invalid. Set the Application ID from Discord Developer Portal → General Information in .env.');
  }

  const guildId = process.env.GUILD_ID?.trim();
  if (guildId && !/^\d{17,20}$/.test(guildId)) {
    throw new Error('[Bot] GUILD_ID is invalid. Use the numeric ID of your Discord test server or leave it empty.');
  }

  const rest = new REST({ version: '10' }).setToken(token);
  try {
    console.log(`[Bot] Registering ${commands.length} application commands.`);
    if (guildId && /^\d{17,20}$/.test(guildId)) {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      ) as unknown[];
      console.log(`[Bot] Registered ${data.length} commands for the configured guild.`);
    } else {
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      ) as unknown[];
      console.log(`[Bot] Registered ${data.length} global commands.`);
    }
  } catch (error: any) {
    if (error?.code === 50001) {
      console.error('[Bot] Discord returned Missing Access. Check the application ID, bot installation, and command-registration permissions.');
    } else {
      console.error('[Bot] Slash-command registration failed:', error);
    }
    throw error;
  }
}
