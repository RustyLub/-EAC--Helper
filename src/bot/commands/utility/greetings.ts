import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { db } from '../../firebase';
import { getGuildLanguage } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('greetings')
  .setDescription('Configure welcome and leave messages')
  .addStringOption(option => option
    .setName('type')
    .setDescription('Which message to configure')
    .setRequired(true)
    .addChoices(
      { name: 'Welcome', value: 'welcome' },
      { name: 'Leave', value: 'leave' },
    ))
  .addBooleanOption(option => option
    .setName('enabled')
    .setDescription('Enable or disable this message')
    .setRequired(true))
  .addChannelOption(option => option
    .setName('channel')
    .setDescription('Text channel for the message')
    .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement))
  .addStringOption(option => option
    .setName('message')
    .setDescription('Text: {user}, {server}, {membercount}')
    .setMaxLength(1800))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId || !interaction.guild) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const english = (await getGuildLanguage(interaction.guildId)) === 'en';
  const type = interaction.options.getString('type', true) as 'welcome' | 'leave';
  const enabled = interaction.options.getBoolean('enabled', true);
  const channel = interaction.options.getChannel('channel');
  const message = interaction.options.getString('message')?.trim();

  if (channel && channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
    await interaction.reply({ content: english ? 'Choose a text channel.' : 'Выберите текстовый канал.', ephemeral: true });
    return;
  }
  if (enabled && !channel) {
    const current = await db.collection('guilds').doc(interaction.guildId).get();
    const channelId = current.data()?.[type]?.channelId;
    if (!channelId) {
      await interaction.reply({
        content: english ? 'Specify a channel when enabling this message.' : 'При включении укажите канал.',
        ephemeral: true,
      });
      return;
    }
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({ content: english ? 'Administrator permission is required.' : 'Требуются права администратора.', ephemeral: true });
    return;
  }

  try {
    await db.collection('guilds').doc(interaction.guildId).set({
      [type]: {
        enabled,
        ...(channel ? { channelId: channel.id } : {}),
        ...(message !== undefined ? { message } : {}),
      },
      updatedAt: new Date().toISOString(),
      updatedBy: interaction.user.id,
    }, { merge: true });

    await interaction.reply({
      content: english
        ? `${type === 'welcome' ? 'Welcome' : 'Leave'} message ${enabled ? 'enabled' : 'disabled'}.${channel ? ` Channel: <#${channel.id}>.` : ''}`
        : `${type === 'welcome' ? 'Приветствие' : 'Сообщение об уходе'} ${enabled ? 'включено' : 'выключено'}.${channel ? ` Канал: <#${channel.id}>.` : ''}`,
      ephemeral: true,
    });
  } catch (error) {
    console.error('[Command:greetings] Failed to save settings:', error);
    await interaction.reply({
      content: english ? 'Could not save greeting settings. Check Firestore access.' : 'Не удалось сохранить настройки. Проверьте доступ к Firestore.',
      ephemeral: true,
    });
  }
}
