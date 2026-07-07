import { Events, Interaction } from 'discord.js';
import { BotClient } from '../types';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const client = interaction.client as BotClient;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`Команда ${interaction.commandName} не найдена.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Ошибка при выполнении команды ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'Произошла ошибка при выполнении этой команды!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'Произошла ошибка при выполнении этой команды!', ephemeral: true });
    }
  }
}
