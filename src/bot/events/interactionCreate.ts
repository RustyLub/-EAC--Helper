import { Events, Interaction } from 'discord.js';
import { BotClient } from '../types';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
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
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'help_category_select') {
      const client = interaction.client as BotClient;
      const helpCommand = client.commands.get('help');
      if (helpCommand && 'handleSelect' in helpCommand) {
        try {
          await (helpCommand as any).handleSelect(interaction);
        } catch (error) {
          console.error(`Ошибка в select menu help:`, error);
        }
      }
    }
  } else if (interaction.isButton()) {
    if (interaction.customId === 'help_bug_report') {
      await interaction.reply({ content: 'Bug report feature coming soon! / Функция репорта багов скоро появится!', ephemeral: true });
    }
  }
}
