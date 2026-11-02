import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { resolveModerationTarget, safeReason } from '../../utils/moderation';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mute (timeout) a user')
  .addUserOption(option => option.setName('target').setDescription('The user to mute').setRequired(true))
  .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes (0 to unmute)').setRequired(true).setMinValue(0).setMaxValue(40320))
  .addStringOption(option => option.setName('reason').setDescription('Reason for the mute').setMaxLength(500))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const lang = await getGuildLanguage(interaction.guildId ?? '');
  const t = translations[lang];
  const targetUser = interaction.options.getUser('target', true);
  const duration = interaction.options.getInteger('duration', true);
  const reason = safeReason(interaction.options.getString('reason'));
  const result = await resolveModerationTarget(interaction, targetUser.id, PermissionFlagsBits.ModerateMembers);
  if (result.ok === false) {
    await interaction.reply({ content: result.message, ephemeral: true });
    return;
  }

  try {
    await result.target.timeout(duration === 0 ? null : duration * 60_000, `${reason} | Moderator: ${interaction.user.tag}`);
    await interaction.reply({
      content: duration === 0 ? t.unmuted(targetUser.tag) : t.muted(targetUser.tag, `${duration}m`, reason),
    });
  } catch (error) {
    console.error('[Command:mute] Failed:', error);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
