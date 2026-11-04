import { MessageFlags, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getGuildLanguage } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
import { CUSTOM_COMMAND_NAME, MAX_CUSTOM_COMMANDS } from '../../utils/settings';
const NAME_PATTERN=CUSTOM_COMMAND_NAME;
export const data=new SlashCommandBuilder().setName('customcommand').setDescription('Manage custom text commands')
.addSubcommand(s=>s.setName('set').setDescription('Create or update a custom command').addStringOption(o=>o.setName('name').setDescription('Command name, without !').setRequired(true).setMaxLength(32)).addStringOption(o=>o.setName('response').setDescription('Response text').setRequired(true).setMaxLength(1800)))
.addSubcommand(s=>s.setName('delete').setDescription('Delete a custom command').addStringOption(o=>o.setName('name').setDescription('Command name').setRequired(true).setMaxLength(32)))
.addSubcommand(s=>s.setName('list').setDescription('List custom commands')).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(i:ChatInputCommandInteraction){
 if(!i.inGuild()||!i.guildId){await i.reply({content:'Эта команда доступна только на сервере.',flags: MessageFlags.Ephemeral});return;}
 const en=await getGuildLanguage(i.guildId)==='en'; if(!i.memberPermissions?.has(PermissionFlagsBits.Administrator)){await i.reply({content:en?'Administrator permission is required.':'Требуются права администратора.',flags: MessageFlags.Ephemeral});return;}
 const commands=getRuntimeGuild(i.guildId).customCommands; const action=i.options.getSubcommand();
 if(action==='list'){const names=Object.keys(commands).sort();await i.reply({content:names.length?(en?'Custom commands: ':'Команды: ')+names.map(n=>'`!'+n+'`').join(', '):(en?'No custom commands configured.':'Команд пока нет.'),flags: MessageFlags.Ephemeral});return;}
 const name=i.options.getString('name',true).trim().toLowerCase();if(!NAME_PATTERN.test(name)){await i.reply({content:en?'Use 1–32 characters: a-z, 0-9, underscore or hyphen.':'Имя: 1–32 символа — латиница, цифры, _ или -.',flags: MessageFlags.Ephemeral});return;}
 if(action==='set'){const response=i.options.getString('response',true).trim();if(!response){await i.reply({content:en?'Response cannot be empty.':'Ответ не может быть пустым.',flags: MessageFlags.Ephemeral});return;}if(!Object.hasOwn(commands,name)&&Object.keys(commands).length>=MAX_CUSTOM_COMMANDS){await i.reply({content:en?`Limit reached: ${MAX_CUSTOM_COMMANDS} custom commands.`:`Достигнут лимит: ${MAX_CUSTOM_COMMANDS} команд.`,flags: MessageFlags.Ephemeral});return;}commands[name]=response;await i.reply({content:(en?'Saved ':'Добавлена ')+ '`!'+name+'` (до перезапуска бота).',flags: MessageFlags.Ephemeral});return;}
 delete commands[name];await i.reply({content:(en?'Deleted ':'Удалена ')+ '`!'+name+'`.',flags: MessageFlags.Ephemeral});
}