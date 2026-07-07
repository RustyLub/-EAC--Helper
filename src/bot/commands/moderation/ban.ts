import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a user from the server')
  .addUserOption(option => 
    option.setName('target')
      .setDescription('The user to ban')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('reason')
      .setDescription('Reason for the ban')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const langId = await getGuildLanguage(interaction.guildId!);
  const t = translations[langId];

  const target = interaction.options.getUser('target');
  const reason = interaction.options.getString('reason') ?? 'No reason provided';
  const member = interaction.guild?.members.cache.get(target!.id);

  if (!member) {
    await interaction.reply({ content: t.userNotFound, ephemeral: true });
    return;
  }

  try {
    await member.ban({ reason });
    await interaction.reply({ content: t.banned(target!.tag, reason) });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
