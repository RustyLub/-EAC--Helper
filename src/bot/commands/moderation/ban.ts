import { MessageFlags, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { resolveModerationTarget, safeReason } from '../../utils/moderation';
import { requireModuleEnabled } from '../../utils/moduleGuard';
export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a user from the server')
  .addUserOption(option => option.setName('target').setDescription('The user to ban').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setMaxLength(500))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await requireModuleEnabled(interaction, 'moderation'))) return;
  const lang = await getGuildLanguage(interaction.guildId ?? '');
  const t = translations[lang];
  const targetUser = interaction.options.getUser('target', true);
  const reason = safeReason(interaction.options.getString('reason'));
  const result = await resolveModerationTarget(interaction, targetUser.id, PermissionFlagsBits.BanMembers);
  if (result.ok === false) {
    await interaction.reply({ content: result.message, flags: MessageFlags.Ephemeral });
    return;
  }

  try {
    await result.target.ban({ reason: `${reason} | Moderator: ${interaction.user.tag}` });
    await interaction.reply({ content: t.banned(targetUser.tag, reason) });
  } catch (error) {
    console.error('[Command:ban] Failed:', error);
    await interaction.reply({ content: t.noPermission, flags: MessageFlags.Ephemeral });
  }
}
