import { Events, GuildMember, EmbedBuilder } from 'discord.js';
import { getRuntimeGuild } from '../utils/runtime';

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(member: GuildMember) {
  if (!member.guild) return;

  try {
    const guildData = getRuntimeGuild(member.guild.id);
    if (guildData.modules.welcome === false) return;
    const data = guildData.welcome;
    if (!data?.enabled || !data?.channelId) return;

    const fetchedChannel = await member.guild.channels.fetch(data.channelId).catch(() => null);
    if (!fetchedChannel?.isSendable()) return;
    const botMember = await member.guild.members.fetchMe().catch(() => null);
    if (!botMember?.permissionsIn(fetchedChannel).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) return;

    let message = data.message || "Привет, {user}! Добро пожаловать на сервер **{server}**. Ты наш {membercount} участник!";
    
    // Replace variables
    message = message
      .replace(/{user}/g, `<@${member.id}>`)
      .replace(/{server}/g, member.guild.name)
      .replace(/{membercount}/g, member.guild.memberCount.toString());

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setDescription(message)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    await fetchedChannel.send({ embeds: [embed], allowedMentions: { parse: [] } });

  } catch (error) {
    console.error('Ошибка в guildMemberAdd:', error);
  }
}
