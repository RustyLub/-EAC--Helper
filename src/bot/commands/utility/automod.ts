import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage } from '../../utils/lang';
import { getRuntimeGuild } from '../../utils/runtime';

export const data = new SlashCommandBuilder().setName('automod').setDescription('Configure automatic message moderation')
  .addBooleanOption(o => o.setName('anti_spam').setDescription('Enable spam protection'))
  .addBooleanOption(o => o.setName('anti_invite').setDescription('Block Discord invite links'))
  .addBooleanOption(o => o.setName('anti_caps').setDescription('Delete excessive uppercase messages'))
  .addStringOption(o => o.setName('bad_words').setDescription('Comma-separated blocked words (use CLEAR to remove all)').setMaxLength(1000))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId) { await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true }); return; }
  const english = (await getGuildLanguage(interaction.guildId)) === 'en';
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) { await interaction.reply({ content: english ? 'Administrator permission is required.' : 'Требуются права администратора.', ephemeral: true }); return; }
  const state = getRuntimeGuild(interaction.guildId);
  const current = state.automod;
  const spam = interaction.options.getBoolean('anti_spam');
  const invites = interaction.options.getBoolean('anti_invite');
  const caps = interaction.options.getBoolean('anti_caps');
  const words = interaction.options.getString('bad_words');
  const changed = spam !== null || invites !== null || caps !== null || words !== null;
  if (!changed) {
    await interaction.reply({ content: [`Anti-spam: ${current.antiSpam ? 'ON' : 'OFF'}`, `Anti-invite: ${current.antiInvite ? 'ON' : 'OFF'}`, `Anti-caps: ${current.antiCaps ? 'ON' : 'OFF'}`, `Bad words: ${current.badWords.length}`, 'Настройки действуют до перезапуска бота.'].join('\n'), ephemeral: true }); return;
  }
  state.automod = {
    antiSpam: spam ?? current.antiSpam, antiInvite: invites ?? current.antiInvite, antiCaps: caps ?? current.antiCaps,
    badWords: words === null ? current.badWords : words.trim().toLowerCase() === 'clear' ? [] : words.split(',').map(w => w.trim().toLowerCase()).filter(Boolean).slice(0, 100),
  };
  await interaction.reply({ content: (english ? 'Automod settings updated in memory. They reset after restart.\n' : 'Настройки автомодерации применены до перезапуска бота.\n') + [`Anti-spam: ${state.automod.antiSpam ? 'ON' : 'OFF'}`, `Anti-invite: ${state.automod.antiInvite ? 'ON' : 'OFF'}`, `Anti-caps: ${state.automod.antiCaps ? 'ON' : 'OFF'}`, `Bad words: ${state.automod.badWords.length}`].join('\n'), ephemeral: true });
}
