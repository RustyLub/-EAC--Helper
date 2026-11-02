import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  TextChannel,
  NewsChannel,
} from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('news')
  .setDescription('Send a news broadcast to a specific channel')
  .addChannelOption(option =>
    option.setName('channel')
      .setDescription('Target channel')
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
  .addStringOption(option =>
    option.setName('title')
      .setDescription('News title')
      .setRequired(true)
      .setMaxLength(256))
  .addStringOption(option =>
    option.setName('content')
      .setDescription('News content')
      .setRequired(true)
      .setMaxLength(4000))
  .addStringOption(option =>
    option.setName('image')
      .setDescription('Optional image URL')
      .setMaxLength(500))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const t = translations[await getGuildLanguage(interaction.guildId!)];
  const targetChannel = interaction.options.getChannel('channel', true);
  if (!(targetChannel instanceof TextChannel) && !(targetChannel instanceof NewsChannel)) {
    await interaction.reply({ content: t.newsError, ephemeral: true });
    return;
  }

  const botMember = interaction.guild.members.me ?? await interaction.guild.members.fetchMe().catch(() => null);
  const permissions = botMember?.permissionsIn(targetChannel);
  if (!permissions?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
    await interaction.reply({ content: t.noPermission, ephemeral: true });
    return;
  }

  const title = interaction.options.getString('title', true).trim();
  const content = interaction.options.getString('content', true).trim();
  const imageUrl = interaction.options.getString('image');
  const embed = new EmbedBuilder()
    .setTitle(`📰 ${title}`)
    .setDescription(content)
    .setColor('#4f46e5')
    .setTimestamp()
    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() || undefined });

  if (imageUrl) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') embed.setImage(parsed.toString());
    } catch {
      await interaction.reply({ content: 'Укажите корректную ссылку на изображение (HTTP или HTTPS).', ephemeral: true });
      return;
    }
  }

  try {
    await targetChannel.send({
      embeds: [embed],
      allowedMentions: { parse: [] },
    });
    await interaction.reply({ content: t.newsSent, ephemeral: true });
  } catch (error) {
    console.error('[Command:news] Failed to send announcement:', error);
    await interaction.reply({ content: t.newsError, ephemeral: true });
  }
}
