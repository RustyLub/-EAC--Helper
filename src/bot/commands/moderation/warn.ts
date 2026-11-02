import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { db } from '../../firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { resolveModerationTarget, safeReason } from '../../utils/moderation';

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

  try {
    const userRef = db.collection('guilds').doc(interaction.guildId).collection('users').doc(target.id);
    await userRef.set({
      warnings: FieldValue.arrayUnion({
        reason,
        createdAt: new Date().toISOString(),
        moderatorId: interaction.user.id,
        moderatorTag: interaction.user.tag,
      }),
      username: target.username,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await interaction.reply({ content: t.warned(target.tag, reason) });
  } catch (error) {
    console.error('[Command:warn] Failed to save warning:', error);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
