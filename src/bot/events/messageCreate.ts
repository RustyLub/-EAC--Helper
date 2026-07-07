import { Events, Message } from 'discord.js';
import { db } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';

export const name = Events.MessageCreate;
export const once = false;

const XP_PER_MESSAGE = 15;
const XP_MULTIPLIER = 100; // Example formula: Level = Math.floor(Math.sqrt(xp / XP_MULTIPLIER))

export async function execute(message: Message) {
  if (message.author.bot || !message.guild) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  try {
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
    
    // Check for level up
    if (newLevel > oldLevel) {
      // Fetch language setting from guild
      const guildDoc = await db.collection('guilds').doc(guildId).get();
      const lang = guildDoc.data()?.language || 'ru';
      
      const levelUpMsg = lang === 'en' 
        ? `Congratulations ${message.author}! You've reached level **${newLevel}**!`
        : `Поздравляем, ${message.author}! Вы достигли **${newLevel}** уровня!`;
        
      if (message.channel.isTextBased() && 'send' in message.channel) {
        await message.channel.send(levelUpMsg);
      }
    }

  } catch (error) {
    console.error('Ошибка при начислении опыта:', error);
  }
}

