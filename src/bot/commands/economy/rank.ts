import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
export const data=new SlashCommandBuilder().setName('rank').setDescription('Check your current level and XP').addUserOption(o=>o.setName('target').setDescription('User to check').setRequired(false));
export async function execute(interaction:ChatInputCommandInteraction){
 if(!interaction.inGuild()||!interaction.guildId){await interaction.reply({content:'Эта команда доступна только на сервере.',ephemeral:true});return;}
 const t=translations[await getGuildLanguage(interaction.guildId)]; const target=interaction.options.getUser('target')||interaction.user;
 const xp=getRuntimeGuild(interaction.guildId).users[target.id]?.xp??0; const level=Math.floor(Math.sqrt(xp/100));
 await interaction.reply({content:t.rankInfo(target.tag,level,xp)+(xp===0?'\n\nОпыт начисляется во время работы бота и сбрасывается после перезапуска.':'')});
}