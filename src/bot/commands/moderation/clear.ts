import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Delete a specific number of recent messages')
  .addIntegerOption(option =>
    option.setName('amount')
      .setDescription('Number of messages to delete (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const langId = await getGuildLanguage(interaction.guildId);
  const t = translations[langId];
  const amount = interaction.options.getInteger('amount', true);
  const channel = interaction.channel;

  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: t.newsError, ephemeral: true });
    return;
  }

  const botMember = interaction.guild.members.me;
  if (!botMember?.permissionsIn(channel).has([PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory])) {
    await interaction.reply({ content: t.noPermission, ephemeral: true });
    return;
  }

  try {
    const deleted = await channel.bulkDelete(amount, true);
    await interaction.reply({ content: t.cleared(deleted.size), ephemeral: true });
  } catch (error) {
    console.error('[Command:clear] Failed to bulk delete messages:', error);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
