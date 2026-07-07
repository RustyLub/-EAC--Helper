import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Delete a specific number of messages')
  .addIntegerOption(option => 
    option.setName('amount')
      .setDescription('Number of messages to delete (1-100)')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  const langId = await getGuildLanguage(interaction.guildId!);
  const t = translations[langId];

  const amount = interaction.options.getInteger('amount')!;

  if (amount < 1 || amount > 100) {
    await interaction.reply({ content: t.invalidAmount, ephemeral: true });
    return;
  }

  try {
    const channel = interaction.channel as TextChannel;
    const deleted = await channel.bulkDelete(amount, true);
    await interaction.reply({ content: t.cleared(deleted.size), ephemeral: true });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
