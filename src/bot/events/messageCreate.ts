import { Events, Message } from 'discord.js';
import { db } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';

export const name = Events.MessageCreate;
export const once = false;

const XP_PER_MESSAGE = 15;
const XP_MULTIPLIER = 100;
const XP_COOLDOWN_MS = 60_000;
const SPAM_WINDOW_MS = 5_000;
const SPAM_LIMIT = 5;
const spamTracker = new Map<string, number[]>();
const xpCooldowns = new Map<string, number>();

function hasModerationBypass(message: Message): boolean {
  return Boolean(message.member?.permissions.has('ManageMessages'));
}

function isMostlyUppercase(content: string): boolean {
  const letters = content.match(/[A-Za-zА-Яа-яЁё]/g) ?? [];
  if (letters.length < 10) return false;
  const uppercase = content.match(/[A-ZА-ЯЁ]/g)?.length ?? 0;
  return uppercase / letters.length > 0.7;
}

export async function execute(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const content = message.content ?? '';
  const memberKey = `${guildId}:${userId}`;
  const bypass = hasModerationBypass(message);

  const sendNotice = async (text: string) => {
    if (message.channel.isSendable()) {
      await message.channel.send({ content: text }).catch((error) => {
        console.error('[Automod] Failed to send notice:', error);
      });
    }
  };

  try {
    const guildRef = db.collection('guilds').doc(guildId);
    const guildDoc = await guildRef.get();
    const guildData = guildDoc.exists ? guildDoc.data() ?? {} : {};
    const automod = guildData.automod ?? {
      antiSpam: true,
      antiInvite: true,
      antiCaps: true,
      badWords: [],
    };

    if (!bypass && automod.antiInvite && /(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)[\w-]+/i.test(content)) {
      await message.delete().catch(() => null);
      await sendNotice(`${message.author}, отправка приглашений запрещена.`);
      return;
    }

    const badWords: string[] = Array.isArray(automod.badWords)
      ? automod.badWords.filter((word: unknown): word is string => typeof word === 'string' && word.trim().length > 0)
      : [];
    const normalizedContent = content.toLocaleLowerCase();
    if (!bypass && badWords.some((word) => normalizedContent.includes(word.toLocaleLowerCase().trim()))) {
      await message.delete().catch(() => null);
      await sendNotice(`${message.author}, сообщение содержит запрещённое слово.`);
      return;
    }

    if (!bypass && automod.antiCaps && isMostlyUppercase(content)) {
      await message.delete().catch(() => null);
      await sendNotice(`${message.author}, пожалуйста, не используйте чрезмерное количество заглавных букв.`);
      return;
    }

    if (!bypass && automod.antiSpam) {
      const now = Date.now();
      const recent = (spamTracker.get(memberKey) ?? []).filter((timestamp) => now - timestamp < SPAM_WINDOW_MS);
      recent.push(now);
      spamTracker.set(memberKey, recent);

      if (recent.length >= SPAM_LIMIT) {
        spamTracker.delete(memberKey);
        await message.delete().catch(() => null);
        const timeoutResult = await message.member?.timeout(60_000, 'EAC Helper: anti-spam').then(() => true).catch(() => false);
        if (timeoutResult) {
          await sendNotice(`${message.author} получил тайм-аут на 1 минуту за спам.`);
        } else {
          await sendNotice(`${message.author}, остановите спам. Не удалось автоматически выдать тайм-аут — проверьте права бота.`);
        }
        return;
      }
    }

    if (content.startsWith('!')) {
      const commandName = content.slice(1).trim().split(/\s+/)[0]?.toLowerCase();
      const customCommands = guildData.customCommands;
      if (commandName && customCommands && typeof customCommands[commandName] === 'string') {
        await sendNotice(customCommands[commandName].slice(0, 2000));
        return;
      }
    }

    // Award XP at most once per minute per member to prevent message flooding.
    const now = Date.now();
    const lastXpAt = xpCooldowns.get(memberKey) ?? 0;
    if (now - lastXpAt < XP_COOLDOWN_MS) return;
    xpCooldowns.set(memberKey, now);

    // Bound in-memory maps so a large server cannot grow them indefinitely.
    if (xpCooldowns.size > 20_000) {
      for (const [key, timestamp] of xpCooldowns) {
        if (now - timestamp > XP_COOLDOWN_MS * 2) xpCooldowns.delete(key);
      }
    }
    if (spamTracker.size > 20_000) spamTracker.clear();

    const userRef = guildRef.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const currentXp = userDoc.exists && typeof userDoc.data()?.xp === 'number'
      ? userDoc.data()!.xp
      : 0;
    const oldLevel = Math.floor(Math.sqrt(Math.max(0, currentXp) / XP_MULTIPLIER));
    const newXp = Math.max(0, currentXp) + XP_PER_MESSAGE;
    const newLevel = Math.floor(Math.sqrt(newXp / XP_MULTIPLIER));

    await userRef.set({
      username: message.author.username,
      xp: FieldValue.increment(XP_PER_MESSAGE),
      updatedAt: FieldValue.serverTimestamp(),
      ...(userDoc.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    }, { merge: true });

    if (newLevel > oldLevel) {
      const language = guildData.language === 'en' ? 'en' : 'ru';
      await sendNotice(language === 'en'
        ? `Congratulations ${message.author}! You've reached level **${newLevel}**!`
        : `Поздравляем, ${message.author}! Вы достигли **${newLevel}** уровня!`);
    }
  } catch (error) {
    console.error('[Bot] Ошибка в обработчике messageCreate:', error);
  }
}
