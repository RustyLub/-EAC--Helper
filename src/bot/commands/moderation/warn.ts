import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { db } from '../../firebase';
import { FieldValue } from 'firebase-admin/firestore';

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
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const langId = await getGuildLanguage(interaction.guildId!);
  const t = translations[langId];

  const target = interaction.options.getUser('target');
  const reason = interaction.options.getString('reason')!;
  
  if (!target) {
    await interaction.reply({ content: t.userNotFound, ephemeral: true });
    return;
  }

  try {
    const userRef = db.collection('guilds').doc(interaction.guildId!).collection('users').doc(target.id);
    await userRef.set({
      warnings: FieldValue.arrayUnion({
        reason,
        date: new Date().toISOString(),
        moderatorId: interaction.user.id
      })
    }, { merge: true });

    await interaction.reply({ content: t.warned(target.tag, reason) });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
