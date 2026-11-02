import {
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../firebase';
import { getGuildLanguage } from '../../utils/lang';

const NAME_PATTERN = /^[a-z0-9_-]{1,32}$/;

export const data = new SlashCommandBuilder()
  .setName('customcommand')
  .setDescription('Manage custom text commands')
  .addSubcommand(subcommand => subcommand
    .setName('set')
    .setDescription('Create or update a custom command')
    .addStringOption(option => option.setName('name').setDescription('Command name, without !').setRequired(true).setMaxLength(32))
    .addStringOption(option => option.setName('response').setDescription('Response text').setRequired(true).setMaxLength(1800)))
  .addSubcommand(subcommand => subcommand
    .setName('delete')
    .setDescription('Delete a custom command')
    .addStringOption(option => option.setName('name').setDescription('Command name').setRequired(true).setMaxLength(32)))
  .addSubcommand(subcommand => subcommand
    .setName('list')
    .setDescription('List custom commands'))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const english = (await getGuildLanguage(interaction.guildId)) === 'en';
  const ref = db.collection('guilds').doc(interaction.guildId);
  const action = interaction.options.getSubcommand();

  try {
    if (action === 'list') {
      const snapshot = await ref.get();
      const commands = snapshot.data()?.customCommands ?? {};
      const names = Object.keys(commands).filter(name => typeof commands[name] === 'string').sort();
      await interaction.reply({
        content: names.length
          ? (english ? `Custom commands: ${names.map(name => `\`!${name}\``).join(', ')}` : `Пользовательские команды: ${names.map(name => `\`!${name}\``).join(', ')}`)
          : (english ? 'No custom commands configured.' : 'Пользовательских команд пока нет.'),
        ephemeral: true,
      });
      return;
    }

    const name = interaction.options.getString('name', true).trim().toLowerCase();
    if (!NAME_PATTERN.test(name)) {
      await interaction.reply({
        content: english ? 'Use 1–32 characters: a-z, 0-9, underscore or hyphen.' : 'Имя: 1–32 символа — латиница, цифры, _ или -.',
        ephemeral: true,
      });
      return;
    }

    if (action === 'set') {
      const response = interaction.options.getString('response', true).trim();
      if (!response) {
        await interaction.reply({ content: english ? 'Response cannot be empty.' : 'Ответ не может быть пустым.', ephemeral: true });
        return;
      }
      await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(ref);
        const stored = snapshot.data()?.customCommands;
        const existing = stored && typeof stored === 'object' && !Array.isArray(stored)
          ? stored as Record<string, unknown>
          : {};
        transaction.set(ref, {
          customCommands: { ...existing, [name]: response },
          updatedAt: new Date().toISOString(),
          updatedBy: interaction.user.id,
        }, { merge: true });
      });
      await interaction.reply({ content: english ? `Command ` + '`!' + name + '`' + ` saved.` : `Команда ` + '`!' + name + '`' + ` сохранена.`, ephemeral: true });
      return;
    }

    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const stored = snapshot.data()?.customCommands;
      if (!stored || typeof stored !== 'object' || Array.isArray(stored) || !(name in stored)) return;
      const nextCommands = { ...(stored as Record<string, unknown>) };
      delete nextCommands[name];
      transaction.set(ref, {
        customCommands: nextCommands,
        updatedAt: new Date().toISOString(),
        updatedBy: interaction.user.id,
      }, { merge: true });
    });
    await interaction.reply({ content: english ? `Command ` + '`!' + name + '`' + ` deleted (if it existed).` : `Команда ` + '`!' + name + '`' + ` удалена, если существовала.`, ephemeral: true });
  } catch (error) {
    console.error('[Command:customcommand] Failed:', error);
    await interaction.reply({
      content: english ? 'Could not update custom commands. Check Firestore access.' : 'Не удалось изменить команды. Проверьте доступ к Firestore.',
      ephemeral: true,
    });
  }
}
