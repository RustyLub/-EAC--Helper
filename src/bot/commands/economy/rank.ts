import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { db } from '../../firebase';

export const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Check your current level and XP')
  .addUserOption(option => 
    option.setName('target')
      .setDescription('User to check (leave blank for yourself)')
      .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  const langId = await getGuildLanguage(interaction.guildId!);
  const t = translations[langId];

  const target = interaction.options.getUser('target') || interaction.user;
  const userRef = db.collection('guilds').doc(interaction.guildId!).collection('users').doc(target.id);
  
  try {
    const doc = await userRef.get();
    const xp = doc.exists ? (doc.data()?.xp || 0) : 0;
    const level = Math.floor(Math.sqrt(xp / 100));

    await interaction.reply({ content: t.rankInfo(target.tag, level, xp) });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
