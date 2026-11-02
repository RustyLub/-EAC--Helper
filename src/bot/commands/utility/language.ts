import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { translations } from '../../utils/lang';
import { db } from '../../firebase';

export const data = new SlashCommandBuilder()
  .setName('language')
  .setDescription('Set the server language (ru/en)')
  .addStringOption(option =>
    option.setName('lang')
      .setDescription('Language code (ru or en)')
      .setRequired(true)
      .addChoices(
        { name: 'Русский', value: 'ru' },
        { name: 'English', value: 'en' }
      ))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({ content: 'Эта команда доступна только на сервере.', ephemeral: true });
    return;
  }

  const newLang = interaction.options.getString('lang', true) as 'ru' | 'en';

  try {
    await db.collection('guilds').doc(interaction.guildId).set({
      language: newLang,
      updatedAt: new Date().toISOString(),
      updatedBy: interaction.user.id,
    }, { merge: true });

    await interaction.reply({
      content: newLang === 'ru'
        ? 'Язык бота успешно изменён на русский.'
        : translations.en.langChanged,
      ephemeral: true,
    });
  } catch (error) {
    console.error('[Command:language] Failed to save server language:', error);
    await interaction.reply({
      content: newLang === 'ru' ? 'Не удалось сохранить язык. Проверьте подключение к базе данных.' : 'Could not save the language. Check the database connection.',
      ephemeral: true,
    });
  }
}
