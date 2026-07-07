import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';
import { db } from '../../firebase';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the server XP leaderboard');

export async function execute(interaction: ChatInputCommandInteraction) {
  const langId = await getGuildLanguage(interaction.guildId!);
  const t = translations[langId];

  try {
    const snapshot = await db.collection('guilds').doc(interaction.guildId!)
                             .collection('users')
                             .orderBy('xp', 'desc')
                             .limit(10)
                             .get();

    if (snapshot.empty) {
      await interaction.reply({ content: t.leaderboardEmpty, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(t.leaderboardTitle)
      .setColor('#fbbf24');

    let desc = '';
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      const level = Math.floor(Math.sqrt(data.xp / 100));
      desc += `**${index + 1}.** ${data.username || `<@${doc.id}>`} - Lvl ${level} (${data.xp} XP)\n`;
    });

    embed.setDescription(desc);

    await interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: t.noPermission, ephemeral: true });
  }
}
