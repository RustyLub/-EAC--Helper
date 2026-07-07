import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Mute (timeout) a user')
  .addUserOption(option => 
    option.setName('target')
      .setDescription('The user to mute')
      .setRequired(true))
  .addIntegerOption(option => 
    option.setName('duration')
      .setDescription('Duration in minutes (0 to unmute)')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('reason')
      .setDescription('Reason for the mute')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const langId = await getGuildLanguage(interaction.guildId!);
  const t = translations[langId];

  const target = interaction.options.getUser('target');
  const duration = interaction.options.getInteger('duration')!;
  const reason = interaction.options.getString('reason') ?? 'No reason provided';
  const member = interaction.guild?.members.cache.get(target!.id);

  if (!member) {
    await interaction.reply({ content: t.userNotFound, ephemeral: true });
    return;
  }

  try {
    if (duration === 0) {
      await member.timeout(null, reason);
      await interaction.reply({ content: t.unmuted(target!.tag) });
    } else {
      await member.timeout(duration * 60 * 1000, reason);
      await interaction.reply({ content: t.muted(target!.tag, `${duration}m`, reason) });
    }
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
