import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
export const data=new SlashCommandBuilder().setName('leaderboard').setDescription('View the server XP leaderboard');
export async function execute(interaction:ChatInputCommandInteraction){
 if(!interaction.inGuild()||!interaction.guildId){await interaction.reply({content:'Эта команда доступна только на сервере.',ephemeral:true});return;}
 const t=translations[await getGuildLanguage(interaction.guildId)];
 const guild=getRuntimeGuild(interaction.guildId); const rows=Object.entries(guild.users).sort((a,b)=>b[1].xp-a[1].xp).slice(0,10);
 if(!rows.length){await interaction.reply({content:t.leaderboardEmpty+' XP появится по мере общения и будет сброшен после перезапуска.',ephemeral:true});return;}
 const description=rows.map(([id,u],i)=>{const level=Math.floor(Math.sqrt(u.xp/guild.levels.xpMultiplier));return `**${i+1}.** ${u.username||`<@${id}>`} — Lvl ${level} (${u.xp} XP)`;}).join('\n');
 await interaction.reply({embeds:[new EmbedBuilder().setTitle(t.leaderboardTitle).setColor('#fbbf24').setDescription(description)]});
}