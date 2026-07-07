import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
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
  const newLang = interaction.options.getString('lang') as 'ru' | 'en';
  
  try {
    await db.collection('guilds').doc(interaction.guildId!).set({
      language: newLang
    }, { merge: true });

    const t = translations[newLang];
    await interaction.reply({ content: newLang === 'ru' ? 'Язык бота успешно изменен на русский.' : t.langChanged });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: 'Failed to change language.', ephemeral: true });
  }
}
