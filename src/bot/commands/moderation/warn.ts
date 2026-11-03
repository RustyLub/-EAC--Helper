import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { resolveModerationTarget, safeReason } from '../../utils/moderation';
import { getRuntimeGuild } from '../../utils/runtime';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warn a user')
  .addUserOption(option =>
    option.setName('target')
      .setDescription('The user to warn')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('reason')
      .setDescription('Reason for the warning')
      .setRequired(true)
      .setMaxLength(500))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const t = translations[await getGuildLanguage(interaction.guildId)];
  const target = interaction.options.getUser('target', true);
  const reason = safeReason(interaction.options.getString('reason', true));
  const result = await resolveModerationTarget(interaction, target.id, PermissionFlagsBits.ModerateMembers);

  if (result.ok === false) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  const guild = getRuntimeGuild(interaction.guildId);
  const warnings = guild.warnings[target.id] ?? [];
  warnings.push({
    reason,
    createdAt: new Date().toISOString(),
    moderatorId: interaction.user.id,
    moderatorTag: interaction.user.tag,
  });
  guild.warnings[target.id] = warnings.slice(-100);
  await interaction.reply({ content: t.warned(target.tag, reason) });
}
