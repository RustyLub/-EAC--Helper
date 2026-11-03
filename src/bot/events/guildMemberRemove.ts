import { Events, GuildMember, EmbedBuilder } from 'discord.js';
import { getRuntimeGuild } from '../utils/runtime';

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember) {
  if (!member.guild) return;

  try {
    const data = getRuntimeGuild(member.guild.id)[ 'leave' ];
    if (!data?.enabled || !data?.channelId) return;

    const fetchedChannel = await member.guild.channels.fetch(data.channelId).catch(() => null);
    if (!fetchedChannel?.isSendable()) return;
    const botMember = await member.guild.members.fetchMe().catch(() => null);
    if (!botMember?.permissionsIn(fetchedChannel).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) return;

    let message = data.message || "**{user}** покинул(а) сервер **{server}**.";
    
    // Replace variables
    message = message
      .replace(/{user}/g, member.user.username)
      .replace(/{server}/g, member.guild.name)
      .replace(/{membercount}/g, member.guild.memberCount.toString());

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setDescription(message)
      .setTimestamp();

    await fetchedChannel.send({ embeds: [embed], allowedMentions: { parse: [] } });

  } catch (error) {
    console.error('Ошибка в guildMemberRemove:', error);
  }
}
