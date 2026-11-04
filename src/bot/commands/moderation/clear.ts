import { MessageFlags,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { requireModuleEnabled } from '../../utils/moduleGuard';
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
  if (!(await requireModuleEnabled(interaction, 'moderation'))) return;
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', flags: MessageFlags.Ephemeral });
    return;
  }

  const langId = await getGuildLanguage(interaction.guildId);
  const t = translations[langId];
  const amount = interaction.options.getInteger('amount', true);
  const channel = interaction.channel;

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
    await interaction.reply({ content: t.noPermission, flags: MessageFlags.Ephemeral });
    return;
  }

  // Поддерживаем текстовые, новостные каналы и ветки — везде, где у канала есть bulkDelete.
  if (!channel || !('bulkDelete' in channel)) {
    await interaction.reply({ content: t.clearUnsupportedChannel, flags: MessageFlags.Ephemeral });
    return;
  }

  const botMember = interaction.guild.members.me;
  if (!botMember?.permissionsIn(channel).has([PermissionFlagsBits.ManageMessages, PermissionFlagsBits.ReadMessageHistory])) {
    await interaction.reply({ content: t.noPermission, flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    const deleted = await channel.bulkDelete(amount, true);
    await interaction.reply({ content: t.cleared(deleted.size), flags: MessageFlags.Ephemeral });
  } catch (error) {
    console.error('[Command:clear] Failed to bulk delete messages:', error);
    await interaction.reply({ content: t.noPermission, flags: MessageFlags.Ephemeral });
  }
}
