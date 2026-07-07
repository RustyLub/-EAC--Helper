import { Events, Message, Collection } from 'discord.js';
import { db } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';

export const name = Events.MessageCreate;
export const once = false;

const XP_PER_MESSAGE = 15;
const XP_MULTIPLIER = 100;

// Simple in-memory spam tracker: { userId: [timestamps] }
const spamTracker = new Collection<string, number[]>();

export async function execute(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const content = message.content;

  try {
    // Fetch guild config for automod & custom commands
    const guildDoc = await db.collection('guilds').doc(guildId).get();
    const guildData = guildDoc.exists ? guildDoc.data() : null;
    const automod = guildData?.automod || { antiSpam: true, antiInvite: true, antiCaps: true, badWords: [] };
    const customCommands = guildData?.customCommands || {};

    // 1. Automod: Anti-Invite
    if (automod.antiInvite) {
      const inviteRegex = /(discord\.gg\/|discordapp\.com\/invite\/)/i;
      if (inviteRegex.test(content) && !message.member?.permissions.has('ManageMessages')) {
        await message.delete().catch(() => {});
        await message.channel.send(`${message.author}, отправка инвайтов запрещена! / Sending invites is forbidden!`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        return;
      }
    }

    // 2. Automod: Bad Words
    if (automod.badWords && automod.badWords.length > 0) {
      const lowerContent = content.toLowerCase();
      const containsBadWord = automod.badWords.some((word: string) => lowerContent.includes(word.toLowerCase()));
      if (containsBadWord && !message.member?.permissions.has('ManageMessages')) {
        await message.delete().catch(() => {});
        await message.channel.send(`${message.author}, использование запрещенных слов запрещено! / Using forbidden words is not allowed!`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        return;
      }
    }

    // 3. Automod: Anti-Caps (More than 70% caps on long messages)
    if (automod.antiCaps && content.length > 10 && !message.member?.permissions.has('ManageMessages')) {
      const capsCount = content.replace(/[^A-ZА-Я]/g, '').length;
      if (capsCount / content.length > 0.7) {
        await message.delete().catch(() => {});
        await message.channel.send(`${message.author}, пожалуйста, не используйте так много заглавных букв! / Please don't use excessive caps!`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
        return;
      }
    }

    // 4. Automod: Anti-Spam
    if (automod.antiSpam && !message.member?.permissions.has('ManageMessages')) {
      const now = Date.now();
      const userTimes = spamTracker.get(message.author.id) || [];
      // keep only times within last 5 seconds
      const recentTimes = userTimes.filter(t => now - t < 5000);
      recentTimes.push(now);
      spamTracker.set(message.author.id, recentTimes);

      if (recentTimes.length > 4) { // More than 4 messages in 5 seconds
        await message.delete().catch(() => {});
        // Basic timeout implementation
        try {
          await message.member?.timeout(60 * 1000, 'Anti-Spam').catch(() => {});
          await message.channel.send(`${message.author} был замьючен на 1 минуту за спам. / has been muted for 1 minute for spamming.`);
        } catch(e) {}
        return;
      }
    }

    // 5. Custom Commands
    if (content.startsWith('!')) {
      const commandName = content.slice(1).split(' ')[0].toLowerCase();
      if (customCommands[commandName]) {
        await message.channel.send(customCommands[commandName]);
        return;
      }
    }

    // --- XP SYSTEM (only if message passed automod) ---
    const userId = message.author.id;
    const userRef = db.collection('guilds').doc(guildId).collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    let newXp = XP_PER_MESSAGE;
    let oldLevel = 0;

    if (userDoc.exists) {
      const data = userDoc.data();
      const currentXp = data?.xp || 0;
      oldLevel = Math.floor(Math.sqrt(currentXp / XP_MULTIPLIER));
      newXp = currentXp + XP_PER_MESSAGE;
      
      await userRef.update({
        xp: FieldValue.increment(XP_PER_MESSAGE),
        username: message.author.username,
        updatedAt: FieldValue.serverTimestamp()
      });
    } else {
      await userRef.set({
        username: message.author.username,
        xp: XP_PER_MESSAGE,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    const newLevel = Math.floor(Math.sqrt(newXp / XP_MULTIPLIER));
    
    if (newLevel > oldLevel) {
      const lang = guildData?.language || 'ru';
      const levelUpMsg = lang === 'en' 
        ? `Congratulations ${message.author}! You've reached level **${newLevel}**!`
        : `Поздравляем, ${message.author}! Вы достигли **${newLevel}** уровня!`;
        
      if (message.channel.isTextBased() && 'send' in message.channel) {
        await message.channel.send(levelUpMsg);
      }
    }

  } catch (error) {
    console.error('Ошибка в messageCreate:', error);
  }
}
