import { Events, GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { db } from '../firebase';

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember) {
  if (!member.guild) return;

  try {
    const guildId = member.guild.id;
    const guildDoc = await db.collection('guilds').doc(guildId).get();
    
    if (!guildDoc.exists) return;
    
    const data = guildDoc.data();
    if (!data?.leave?.enabled || !data?.leave?.channelId) return;

    const channel = member.guild.channels.cache.get(data.leave.channelId) as TextChannel;
    if (!channel || !channel.isTextBased()) return;

    let message = data.leave.message || "**{user}** покинул(а) сервер **{server}**.";
    
    // Replace variables
    message = message
      .replace(/{user}/g, member.user.username)
      .replace(/{server}/g, member.guild.name)
      .replace(/{membercount}/g, member.guild.memberCount.toString());

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setDescription(message)
      .setTimestamp();

    await channel.send({ embeds: [embed] });

  } catch (error) {
    console.error('Ошибка в guildMemberRemove:', error);
  }
}
