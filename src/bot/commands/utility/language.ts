import { MessageFlags, ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translations } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';
export const data = new SlashCommandBuilder().setName('language').setDescription('Set the server language (ru/en)')
  .addStringOption(o => o.setName('lang').setDescription('Language code').setRequired(true).addChoices({name:'Русский',value:'ru'},{name:'English',value:'en'}))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId) { await interaction.reply({content:'Эта команда доступна только на сервере.',flags: MessageFlags.Ephemeral}); return; }
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) { await interaction.reply({content:translations.ru.noPermission,flags: MessageFlags.Ephemeral}); return; }
  const lang=interaction.options.getString('lang',true) as 'ru'|'en';
  getRuntimeGuild(interaction.guildId).language=lang;
  await interaction.reply({content:lang==='ru'?'Язык установлен: русский. Настройка действует до перезапуска бота.':'Language set to English. This setting resets after bot restart.',flags: MessageFlags.Ephemeral});
}