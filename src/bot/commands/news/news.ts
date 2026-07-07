import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, TextChannel } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('news')
  .setDescription('Send a news broadcast to a specific channel')
  .addChannelOption(option => 
    option.setName('channel')
      .setDescription('Target channel')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('title')
      .setDescription('News Title')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('content')
      .setDescription('News Content')
      .setRequired(true))
  .addStringOption(option => 
    option.setName('image')
      .setDescription('Image URL')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const langId = await getGuildLanguage(interaction.guildId!);
  const t = translations[langId];

  const targetChannel = interaction.options.getChannel('channel') as TextChannel;
  const title = interaction.options.getString('title')!;
  const content = interaction.options.getString('content')!;
  const imageUrl = interaction.options.getString('image');

  if (!targetChannel || !targetChannel.isTextBased()) {
    await interaction.reply({ content: t.newsError, ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`📰 ${title}`)
    .setDescription(content)
    .setColor('#4f46e5')
    .setTimestamp()
    .setFooter({ text: interaction.guild?.name || 'News Broadcast', iconURL: interaction.guild?.iconURL() || undefined });

  if (imageUrl) {
    try {
      embed.setImage(imageUrl);
    } catch {
      // Ignore invalid image URL
    }
  }

  try {
    await targetChannel.send({ embeds: [embed] });
    await interaction.reply({ content: t.newsSent, ephemeral: true });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: t.newsError, ephemeral: true });
  }
}
