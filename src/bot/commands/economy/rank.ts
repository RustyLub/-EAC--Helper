import { MessageFlags, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
import { requireModuleEnabled } from '../../utils/moduleGuard';
export const data=new SlashCommandBuilder().setName('rank').setDescription('Check your current level and XP').addUserOption(o=>o.setName('target').setDescription('User to check').setRequired(false));
export async function execute(interaction:ChatInputCommandInteraction){
  if (!(await requireModuleEnabled(interaction, 'levels'))) return;
 if(!interaction.inGuild()||!interaction.guildId){await interaction.reply({content:'Эта команда доступна только на сервере.',flags: MessageFlags.Ephemeral});return;}
 const t=translations[await getGuildLanguage(interaction.guildId)]; const target=interaction.options.getUser('target')||interaction.user;
 const guild=getRuntimeGuild(interaction.guildId); const xp=guild.users[target.id]?.xp??0; const level=Math.floor(Math.sqrt(xp/guild.levels.xpMultiplier));
 await interaction.reply({content:t.rankInfo(target.tag,level,xp)+(xp===0?'\n\nОпыт начисляется во время работы бота и сбрасывается после перезапуска.':'')});
}