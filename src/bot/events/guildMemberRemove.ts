import { Events, GuildMember, EmbedBuilder } from 'discord.js';
import { getRuntimeGuild } from '../utils/runtime';
import { renderTemplate } from '../utils/template';

export const name = Events.GuildMemberRemove;
export const once = false;

export async function execute(member: GuildMember) {
  if (!member.guild) return;

  try {
    const guildData = getRuntimeGuild(member.guild.id);
    if (guildData.modules.welcome === false) return;
    const data = guildData.leave;
    if (!data?.enabled || !data?.channelId) return;

    const fetchedChannel = await member.guild.channels.fetch(data.channelId).catch(() => null);
    if (!fetchedChannel?.isSendable()) return;
    const botMember = await member.guild.members.fetchMe().catch(() => null);
    if (!botMember?.permissionsIn(fetchedChannel).has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) return;

    const template = data.message || "**{user}** покинул(а) сервер **{server}**.";
    const message = renderTemplate(template, {
      user: member.user.username,
      server: member.guild.name,
      membercount: member.guild.memberCount.toString(),
    });

    const embed = new EmbedBuilder()
      .setColor('#ED4245')
      .setDescription(message)
      .setTimestamp();

    await fetchedChannel.send({ embeds: [embed], allowedMentions: { parse: [] } });

  } catch (error) {
    console.error('Ошибка в guildMemberRemove:', error);
  }
}
