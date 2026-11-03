import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getGuildLanguage } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
const NAME_PATTERN=/^[a-z0-9_-]{1,32}$/;
export const data=new SlashCommandBuilder().setName('customcommand').setDescription('Manage custom text commands')
.addSubcommand(s=>s.setName('set').setDescription('Create or update a custom command').addStringOption(o=>o.setName('name').setDescription('Command name, without !').setRequired(true).setMaxLength(32)).addStringOption(o=>o.setName('response').setDescription('Response text').setRequired(true).setMaxLength(1800)))
.addSubcommand(s=>s.setName('delete').setDescription('Delete a custom command').addStringOption(o=>o.setName('name').setDescription('Command name').setRequired(true).setMaxLength(32)))
.addSubcommand(s=>s.setName('list').setDescription('List custom commands')).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(i:ChatInputCommandInteraction){
 if(!i.inGuild()||!i.guildId){await i.reply({content:'Эта команда доступна только на сервере.',ephemeral:true});return;}
 const en=await getGuildLanguage(i.guildId)==='en'; if(!i.memberPermissions?.has(PermissionFlagsBits.Administrator)){await i.reply({content:en?'Administrator permission is required.':'Требуются права администратора.',ephemeral:true});return;}
 const commands=getRuntimeGuild(i.guildId).customCommands; const action=i.options.getSubcommand();
 if(action==='list'){const names=Object.keys(commands).sort();await i.reply({content:names.length?(en?'Custom commands: ':'Команды: ')+names.map(n=>'`!'+n+'`').join(', '):(en?'No custom commands configured.':'Команд пока нет.'),ephemeral:true});return;}
 const name=i.options.getString('name',true).trim().toLowerCase();if(!NAME_PATTERN.test(name)){await i.reply({content:en?'Use 1–32 characters: a-z, 0-9, underscore or hyphen.':'Имя: 1–32 символа — латиница, цифры, _ или -.',ephemeral:true});return;}
 if(action==='set'){const response=i.options.getString('response',true).trim();if(!response){await i.reply({content:en?'Response cannot be empty.':'Ответ не может быть пустым.',ephemeral:true});return;}commands[name]=response;await i.reply({content:(en?'Saved ':'Добавлена ')+ '`!'+name+'` (до перезапуска бота).',ephemeral:true});return;}
 delete commands[name];await i.reply({content:(en?'Deleted ':'Удалена ')+ '`!'+name+'`.',ephemeral:true});
}