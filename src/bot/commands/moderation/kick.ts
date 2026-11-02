import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { resolveModerationTarget, safeReason } from '../../utils/moderation';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a user from the server')
  .addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for the kick').setMaxLength(500))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const lang = await getGuildLanguage(interaction.guildId ?? '');
  const t = translations[lang];
  const targetUser = interaction.options.getUser('target', true);
  const reason = safeReason(interaction.options.getString('reason'));
  const result = await resolveModerationTarget(interaction, targetUser.id, PermissionFlagsBits.KickMembers);
  if (!result.ok) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  try {
    await result.target.kick(`${reason} | Moderator: ${interaction.user.tag}`);
    await interaction.reply({ content: t.kicked(targetUser.tag, reason) });
  } catch (error) {
    console.error('[Command:kick] Failed:', error);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
