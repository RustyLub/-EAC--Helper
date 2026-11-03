import { Events, Message, PermissionFlagsBits } from 'discord.js';
import { getRuntimeGuild } from '../utils/runtime';

export const name = Events.MessageCreate;
export const once = false;

const XP_PER_MESSAGE = 15;
const XP_MULTIPLIER = 100;
const XP_COOLDOWN_MS = 60_000;
const SPAM_WINDOW_MS = 5_000;
const SPAM_LIMIT = 5;
const MAP_LIMIT = 20_000;
const spamTracker = new Map<string, number[]>();
const xpCooldowns = new Map<string, number>();

function hasModerationBypass(message: Message): boolean {
  return Boolean(message.member?.permissions.has(PermissionFlagsBits.ManageMessages));
}

function isMostlyUppercase(content: string): boolean {
  const letters = content.match(/[A-Za-zА-Яа-яЁё]/g) ?? [];
  if (letters.length < 10) return false;
  const uppercase = content.match(/[A-ZА-ЯЁ]/g)?.length ?? 0;
  return uppercase / letters.length > 0.7;
}

function pruneMemory(now: number): void {
  for (const [key, timestamps] of spamTracker) {
    const recent = timestamps.filter(timestamp => now - timestamp < SPAM_WINDOW_MS);
    if (recent.length) spamTracker.set(key, recent);
    else spamTracker.delete(key);
  }
  for (const [key, timestamp] of xpCooldowns) {
    if (now - timestamp > XP_COOLDOWN_MS * 2) xpCooldowns.delete(key);
  }
  // Prevent unbounded memory use without clearing active users' protection state.
  while (spamTracker.size > MAP_LIMIT) {
    const oldest = spamTracker.keys().next().value;
    if (oldest === undefined) break;
    spamTracker.delete(oldest);
  }
  while (xpCooldowns.size > MAP_LIMIT) {
    const oldest = xpCooldowns.keys().next().value;
    if (oldest === undefined) break;
    xpCooldowns.delete(oldest);
  }
}

export async function execute(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;
  const content = message.content ?? '';
  const memberKey = `${guildId}:${userId}`;
  const bypass = hasModerationBypass(message);
  const now = Date.now();
  pruneMemory(now);

  const sendNotice = async (text: string) => {
    if (message.channel.isSendable()) {
      await message.channel.send({ content: text, allowedMentions: { users: [userId] } }).catch(error => {
        console.error('[Automod] Failed to send notice:', error);
      });
    }
  };

  try {
    const guildData = getRuntimeGuild(guildId);
    const automod = guildData.automod;
    const automodEnabled = guildData.modules.automod !== false;

    if (automodEnabled && !bypass && automod.antiInvite === true && /(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)[\w-]+/i.test(content)) {
      await message.delete().catch(() => null);
      await sendNotice(`${message.author}, отправка приглашений запрещена.`);
      return;
    }

    const badWords: string[] = Array.isArray(automod.badWords)
      ? automod.badWords.filter((word: unknown): word is string => typeof word === 'string' && word.trim().length > 0)
      : [];
    const normalizedContent = content.toLocaleLowerCase();
    if (automodEnabled && !bypass && badWords.some(word => normalizedContent.includes(word.toLocaleLowerCase().trim()))) {
      await message.delete().catch(() => null);
      await sendNotice(`${message.author}, сообщение содержит запрещённое слово.`);
      return;
    }

    if (automodEnabled && !bypass && automod.antiCaps === true && isMostlyUppercase(content)) {
      await message.delete().catch(() => null);
      await sendNotice(`${message.author}, пожалуйста, не используйте чрезмерное количество заглавных букв.`);
      return;
    }

    if (automodEnabled && !bypass && automod.antiSpam === true) {
      const recent = (spamTracker.get(memberKey) ?? []).filter(timestamp => now - timestamp < SPAM_WINDOW_MS);
      recent.push(now);
      spamTracker.set(memberKey, recent);

      if (recent.length >= SPAM_LIMIT) {
        spamTracker.delete(memberKey);
        await message.delete().catch(() => null);
        const timedOut = await message.member?.timeout(60_000, 'EAC Helper: anti-spam').then(() => true).catch(() => false);
        await sendNotice(timedOut
          ? `${message.author} получил тайм-аут на 1 минуту за спам.`
          : `${message.author}, остановите спам. Не удалось выдать тайм-аут — проверьте права бота.`);
        return;
      }
    }

    if (guildData.modules['custom-commands'] !== false && content.startsWith('!')) {
      const commandName = content.slice(1).trim().split(/\s+/)[0]?.toLowerCase();
      const customCommands = guildData.customCommands;
      if (commandName && customCommands && typeof customCommands[commandName] === 'string') {
        await sendNotice(customCommands[commandName].slice(0, 2000));
        return;
      }
    }

    if (guildData.modules.levels === false) return;

    const lastXpAt = xpCooldowns.get(memberKey) ?? 0;
    if (now - lastXpAt < XP_COOLDOWN_MS) return;
    const user = guildData.users[userId] ?? { username: message.author.username, xp: 0 };
    const oldLevel = Math.floor(Math.sqrt(user.xp / XP_MULTIPLIER));
    user.username = message.author.username;
    user.xp += XP_PER_MESSAGE;
    guildData.users[userId] = user;
    const newLevel = Math.floor(Math.sqrt(user.xp / XP_MULTIPLIER));
    xpCooldowns.set(memberKey, now);

    if (newLevel > oldLevel) {
      await sendNotice(guildData.language === 'en'
        ? `Congratulations ${message.author}! You've reached level **${newLevel}**!`
        : `Поздравляем, ${message.author}! Вы достигли **${newLevel}** уровня!`);
    }
  } catch (error) {
    console.error('[Bot] Ошибка в обработчике messageCreate:', error);
  }
}
