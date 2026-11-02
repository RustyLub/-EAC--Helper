import { Events, Interaction } from 'discord.js';
import { BotClient } from '../types';

export const name = Events.InteractionCreate;
export const once = false;

async function reportInteractionError(interaction: Interaction, error: unknown): Promise<void> {
  console.error('[Bot] Interaction failed:', error);
  const payload = { content: 'Не удалось выполнить действие. Попробуйте ещё раз позже.', ephemeral: true };

  try {
    if (!interaction.isRepliable()) return;

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (replyError) {
    console.error('[Bot] Could not report interaction error to Discord:', replyError);
  }
}

export async function execute(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      const client = interaction.client as BotClient;
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        await interaction.reply({ content: 'Эта команда больше не зарегистрирована. Обновите команды бота.', ephemeral: true });
        return;
      }
      await command.execute(interaction);
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'help_category_select') {
      const client = interaction.client as BotClient;
      const helpCommand = client.commands.get('help') as any;
      if (helpCommand && typeof helpCommand.handleSelect === 'function') {
        await helpCommand.handleSelect(interaction);
      } else {
        await interaction.reply({ content: 'Меню помощи устарело. Выполните /help ещё раз.', ephemeral: true });
      }
    }
  } catch (error) {
    await reportInteractionError(interaction, error);
  }
}
