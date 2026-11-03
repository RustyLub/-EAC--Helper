import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getGuildLanguage } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
export const data=new SlashCommandBuilder().setName('greetings').setDescription('Configure welcome and leave messages')
.addStringOption(o=>o.setName('type').setDescription('Which message to configure').setRequired(true).addChoices({name:'Welcome',value:'welcome'},{name:'Leave',value:'leave'}))
.addBooleanOption(o=>o.setName('enabled').setDescription('Enable or disable this message').setRequired(true))
.addChannelOption(o=>o.setName('channel').setDescription('Text channel for the message').addChannelTypes(ChannelType.GuildText,ChannelType.GuildAnnouncement))
.addStringOption(o=>o.setName('message').setDescription('Text: {user}, {server}, {membercount}').setMaxLength(1800))
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(i:ChatInputCommandInteraction){
 if(!i.inGuild()||!i.guildId){await i.reply({content:'Эта команда доступна только на сервере.',ephemeral:true});return;}
 const en=await getGuildLanguage(i.guildId)==='en';if(!i.memberPermissions?.has(PermissionFlagsBits.Administrator)){await i.reply({content:en?'Administrator permission is required.':'Требуются права администратора.',ephemeral:true});return;}
 const type=i.options.getString('type',true) as 'welcome'|'leave';const enabled=i.options.getBoolean('enabled',true);const channel=i.options.getChannel('channel');const message=i.options.getString('message')?.trim();
 if(channel&&channel.type!==ChannelType.GuildText&&channel.type!==ChannelType.GuildAnnouncement){await i.reply({content:en?'Choose a text channel.':'Выберите текстовый канал.',ephemeral:true});return;}
 const state=getRuntimeGuild(i.guildId);const current=state[type]??{enabled:false};
 if(enabled&&!channel&&!current.channelId){await i.reply({content:en?'Specify a channel when enabling this message.':'При включении укажите канал.',ephemeral:true});return;}
 state[type]={enabled,...(channel?{channelId:channel.id}:current.channelId?{channelId:current.channelId}:{}),...(message!==undefined?{message}:current.message?{message:current.message}:{})};
 await i.reply({content:(en?'Updated in memory; resets after restart.':'Настройка применена до перезапуска бота.')+(channel?' Channel: <#'+channel.id+'>.':''),ephemeral:true});
}