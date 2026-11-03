import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getRuntimeGuild } from '../../utils/runtime';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('View or clear a user\'s warnings')
  .addUserOption(option => option.setName('target').setDescription('User whose warnings to view').setRequired(false))
  .addBooleanOption(option => option.setName('clear').setDescription('Clear the selected user\'s warnings').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
    await interaction.reply({ content: 'Недостаточно прав для просмотра предупреждений.', ephemeral: true });
    return;
  }

  const target = interaction.options.getUser('target') ?? interaction.user;
  const guild = getRuntimeGuild(interaction.guildId);
  const records = guild.warnings[target.id] ?? [];

  if (interaction.options.getBoolean('clear') === true) {
    delete guild.warnings[target.id];
    await interaction.reply({ content: `Предупреждения пользователя **${target.tag}** очищены.`, ephemeral: true });
    return;
  }

  if (!records.length) {
    await interaction.reply({ content: `У пользователя **${target.tag}** нет предупреждений в текущем сеансе бота.`, ephemeral: true });
    return;
  }

  const lines = records.slice(-3).reverse().map((warning, index) => {
    const timestamp = Math.floor(new Date(warning.createdAt).getTime() / 1000);
    return `**${index + 1}.** ${warning.reason}\nМодератор: ${warning.moderatorTag} · <t:${timestamp}:R>`;
  });
  const remaining = records.length > 10 ? `\nИ ещё ${records.length - 10} предупреждений.` : '';
  await interaction.reply({
    content: `**Предупреждения: ${target.tag}**\n${lines.join('\n\n')}${remaining}`,
    ephemeral: true,
    allowedMentions: { parse: [] },
  });
}
