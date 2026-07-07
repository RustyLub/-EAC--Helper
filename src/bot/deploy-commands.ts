import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { commands as commandModules } from './registry';

const commands = [];

for (const command of commandModules) {
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] Команда не содержит обязательных свойств "data" или "execute".`);
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

export async function deployCommands() {
  try {
    console.log(`Начато обновление ${commands.length} application (/) commands.`);

    let data: any;
    if (process.env.GUILD_ID && process.env.GUILD_ID !== 'YOUR_GUILD_ID') {
        data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID),
            { body: commands },
        );
        console.log(`Успешно обновлено ${data.length} application (/) commands для сервера.`);
    } else {
        data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: commands },
        );
        console.log(`Успешно обновлено ${data.length} глобальных application (/) commands.`);
    }

  } catch (error) {
    console.error('Ошибка при обновлении команд:', error);
  }
}

