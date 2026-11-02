import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config';
import { BotClient, Command } from './types';
import { deployCommands } from './deploy-commands';
import { commands, events } from './registry';

type EventHandler = (...args: any[]) => unknown;

export async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token || token === 'YOUR_DISCORD_BOT_TOKEN') {
    console.warn('[Bot] DISCORD_TOKEN is not configured; the web API will start without the Discord bot.');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  }) as BotClient;

  client.commands = new Collection<string, Command>();

  for (const command of commands) {
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command as unknown as Command);
    } else {
      console.warn('[Bot] A command is missing required data or execute properties.');
    }
  }

  for (const event of events) {
    const handler = event.execute as EventHandler;
    if (event.once) {
      client.once(event.name as any, (...args: unknown[]) => { void handler(...args); });
    } else {
      client.on(event.name as any, (...args: unknown[]) => { void handler(...args); });
    }
  }

  try {
    await deployCommands();
  } catch (error) {
    // A temporary command-registration failure must not prevent the bot from
    // connecting and serving commands that are already registered.
    console.error('[Bot] Slash-command registration failed; continuing startup:', error);
  }

  try {
    await client.login(token);
  } catch (error) {
    console.error('[Bot] Discord login failed:', error);
    client.destroy();
  }
}
