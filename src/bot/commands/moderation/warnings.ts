import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
import { requireModuleEnabled } from '../../utils/moduleGuard';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('View or clear a user\'s warnings')
  .addUserOption(option => option.setName('target').setDescription('User whose warnings to view').setRequired(false))
  .addBooleanOption(option => option.setName('clear').setDescription('Clear the selected user\'s warnings').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await requireModuleEnabled(interaction, 'moderation'))) return;
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const lang = await getGuildLanguage(interaction.guildId);
  const isRu = lang === 'ru';
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
    await interaction.reply({ content: isRu ? 'Недостаточно прав для просмотра предупреждений.' : 'You do not have permission to view warnings.', ephemeral: true });
    return;
  }

  const target = interaction.options.getUser('target') ?? interaction.user;
  const guild = getRuntimeGuild(interaction.guildId);
  const records = guild.warnings[target.id] ?? [];

  if (interaction.options.getBoolean('clear') === true) {
    delete guild.warnings[target.id];
    await interaction.reply({
      content: isRu ? `Предупреждения пользователя **${target.tag}** очищены.` : `Warnings for **${target.tag}** have been cleared.`,
      ephemeral: true,
    });
    return;
  }

  if (!records.length) {
    await interaction.reply({
      content: isRu
        ? `У пользователя **${target.tag}** нет предупреждений в текущем сеансе бота.`
        : `**${target.tag}** has no warnings in the current bot session.`,
      ephemeral: true,
    });
    return;
  }

  const lines = records.slice(-3).reverse().map((warning, index) => {
    const timestamp = Math.floor(new Date(warning.createdAt).getTime() / 1000);
    const moderatorLabel = isRu ? 'Модератор' : 'Moderator';
    return `**${index + 1}.** ${warning.reason}
${moderatorLabel}: ${warning.moderatorTag} · <t:${timestamp}:R>`;
  });
  const remaining = records.length > 3
    ? (isRu ? `
И ещё ${records.length - 3} предупреждений.` : `
And ${records.length - 3} more warnings.`)
    : '';
  await interaction.reply({
    content: `**${isRu ? 'Предупреждения' : 'Warnings'}: ${target.tag}**
${lines.join('\n\n')}${remaining}`,
    ephemeral: true,
    allowedMentions: { parse: [] },
  });
}
