import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../../firebase';
import { getGuildLanguage } from '../../utils/lang';

type AutomodSettings = {
  antiSpam: boolean;
  antiInvite: boolean;
  antiCaps: boolean;
  badWords: string[];
};

const DEFAULTS: AutomodSettings = {
  antiSpam: false,
  antiInvite: false,
  antiCaps: false,
  badWords: [],
};

export const data = new SlashCommandBuilder()
  .setName('automod')
  .setDescription('Configure automatic message moderation')
  .addBooleanOption(option => option.setName('anti_spam').setDescription('Enable spam protection'))
  .addBooleanOption(option => option.setName('anti_invite').setDescription('Block Discord invite links'))
  .addBooleanOption(option => option.setName('anti_caps').setDescription('Delete excessive uppercase messages'))
  .addStringOption(option => option.setName('bad_words').setDescription('Comma-separated blocked words (use CLEAR to remove all)').setMaxLength(1000))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const language = await getGuildLanguage(interaction.guildId);
  const english = language === 'en';
  const guildRef = db.collection('guilds').doc(interaction.guildId);

  try {
    const snapshot = await guildRef.get();
    const stored = snapshot.data()?.automod ?? {};
    const current: AutomodSettings = {
      antiSpam: stored.antiSpam === true,
      antiInvite: stored.antiInvite === true,
      antiCaps: stored.antiCaps === true,
      badWords: Array.isArray(stored.badWords)
        ? stored.badWords.filter((word: unknown): word is string => typeof word === 'string')
        : [],
    };

    const spam = interaction.options.getBoolean('anti_spam');
    const invites = interaction.options.getBoolean('anti_invite');
    const caps = interaction.options.getBoolean('anti_caps');
    const words = interaction.options.getString('bad_words');
    const changed = spam !== null || invites !== null || caps !== null || words !== null;

    if (!changed) {
      const status = [
        `Anti-spam: ${current.antiSpam ? 'ON' : 'OFF'}`,
        `Anti-invite: ${current.antiInvite ? 'ON' : 'OFF'}`,
        `Anti-caps: ${current.antiCaps ? 'ON' : 'OFF'}`,
        `Bad words: ${current.badWords.length}`,
      ].join('\n');
      await interaction.reply({ content: status, ephemeral: true });
      return;
    }

    const next: AutomodSettings = {
      antiSpam: spam ?? current.antiSpam,
      antiInvite: invites ?? current.antiInvite,
      antiCaps: caps ?? current.antiCaps,
      badWords: words === null
        ? current.badWords
        : words.trim().toLocaleLowerCase() === 'clear'
          ? []
          : words.split(',').map(word => word.trim().toLocaleLowerCase()).filter(Boolean).slice(0, 100),
    };

    await guildRef.set({
      automod: next,
      updatedAt: new Date().toISOString(),
      updatedBy: interaction.user.id,
    }, { merge: true });

    const result = [
      `Anti-spam: ${next.antiSpam ? 'ON' : 'OFF'}`,
      `Anti-invite: ${next.antiInvite ? 'ON' : 'OFF'}`,
      `Anti-caps: ${next.antiCaps ? 'ON' : 'OFF'}`,
      `Bad words: ${next.badWords.length}`,
    ].join('\n');

    await interaction.reply({
      content: (english ? 'Automod settings saved.\n' : 'Настройки автомодерации сохранены.\n') + result,
      ephemeral: true,
    });
  } catch (error) {
    console.error('[Command:automod] Failed to update settings:', error);
    await interaction.reply({
      content: english ? 'Could not save automod settings. Check Firestore access.' : 'Не удалось сохранить настройки автомодерации. Проверь доступ к Firestore.',
      ephemeral: true,
    });
  }
}
