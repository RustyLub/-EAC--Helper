import { Client, GatewayIntentBits, Collection } from 'discord.js';
import 'dotenv/config';
import { BotClient, Command } from './types';
import { deployCommands } from './deploy-commands';
import { commands, events } from './registry';

export async function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  }) as BotClient;

  client.commands = new Collection<string, Command>();

  // Загрузка команд
  for (const command of commands) {
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command as unknown as Command);
    } else {
      console.log(`[WARNING] Команда не содержит обязательных свойств "data" или "execute".`);
    }
  }

  // Загрузка событий
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  try {
    if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN') {
      await deployCommands();
      await client.login(process.env.DISCORD_TOKEN);
    } else {
      console.log('Пожалуйста, укажите настоящий DISCORD_TOKEN в файле .env');
    }
  } catch (error) {
    console.error('Ошибка входа Discord-бота:', error);
  }
}

