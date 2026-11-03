import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config';
import { BotClient, Command } from './types';
import { deployCommands } from './deploy-commands';
import { commands, events } from './registry';

type EventHandler = (...args: any[]) => unknown;

export async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token || token === 'YOUR_DISCORD_BOT_TOKEN') {
    throw new Error('DISCORD_TOKEN is not configured. Fill in the .env file.');
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
  const registeredNames = new Set<string>();

  for (const command of commands) {
    if (!('data' in command) || !('execute' in command) || typeof command.execute !== 'function') {
      throw new Error('[Bot] A registered command is missing its slash-command data or execute handler.');
    }
    const commandName = command.data.name;
    if (registeredNames.has(commandName)) {
      throw new Error(`[Bot] Duplicate slash-command name: ${commandName}`);
    }
    registeredNames.add(commandName);
    client.commands.set(commandName, command as unknown as Command);
  }

  for (const event of events) {
    const handler = event.execute as EventHandler;
    const guardedHandler = (...args: unknown[]) => {
      Promise.resolve(handler(...args)).catch(error => {
        console.error(`[Bot] Event handler "${event.name}" failed:`, error);
      });
    };
    if (event.once) {
      client.once(event.name as any, guardedHandler);
    } else {
      client.on(event.name as any, guardedHandler);
    }
  }

  try {
    await deployCommands();
  } catch (error) {
    // Command registration errors should be visible, but must not prevent the gateway client from starting.
    console.error('[Bot] Slash-command registration failed; continuing with the existing commands:', error);
  }

  try {
    await client.login(token);
  } catch (error) {
    client.destroy();
    throw error;
  }
}
