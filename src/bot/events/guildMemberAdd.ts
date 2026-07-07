import { Events, GuildMember, TextChannel, EmbedBuilder } from 'discord.js';
import { db } from '../firebase';

export const name = Events.GuildMemberAdd;
export const once = false;

export async function execute(member: GuildMember) {
  if (!member.guild) return;

  try {
    const guildId = member.guild.id;
    const guildDoc = await db.collection('guilds').doc(guildId).get();
    
    if (!guildDoc.exists) return;
    
    const data = guildDoc.data();
    if (!data?.welcome?.enabled || !data?.welcome?.channelId) return;

    const channel = member.guild.channels.cache.get(data.welcome.channelId) as TextChannel;
    if (!channel || !channel.isTextBased()) return;

    let message = data.welcome.message || "Привет, {user}! Добро пожаловать на сервер **{server}**. Ты наш {membercount} участник!";
    
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

    await channel.send({ embeds: [embed] });

  } catch (error) {
    console.error('Ошибка в guildMemberAdd:', error);
  }
}
