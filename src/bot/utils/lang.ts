import { db } from '../firebase';

export async function getGuildLanguage(guildId: string): Promise<'ru' | 'en'> {
  try {
    const doc = await db.collection('guilds').doc(guildId).get();
    if (doc.exists) {
      return doc.data()?.language || 'ru';
    }
  } catch (err) {
    console.error('Error fetching language:', err);
  }
  return 'ru';
}

export const translations = {
  ru: {
    userNotFound: 'Пользователь не найден на сервере.',
    noPermission: 'Не удалось выполнить действие (недостаточно прав).',
    banned: (user: string, reason: string) => `Пользователь **${user}** был забанен.\nПричина: *${reason}*`,
    kicked: (user: string, reason: string) => `Пользователь **${user}** был кикнут.\nПричина: *${reason}*`,
    muted: (user: string, time: string, reason: string) => `Пользователь **${user}** отправлен в тайм-аут на ${time}.\nПричина: *${reason}*`,
    unmuted: (user: string) => `Тайм-аут для **${user}** снят.`,
    warned: (user: string, reason: string) => `Пользователь **${user}** получил предупреждение.\nПричина: *${reason}*`,
    cleared: (count: number) => `Удалено **${count}** сообщений.`,
    invalidAmount: 'Укажите количество сообщений от 1 до 100.',
    newsSent: 'Новость успешно отправлена!',
    langChanged: 'Язык бота успешно изменен на русский.',
    rankInfo: (user: string, level: number, xp: number) => `**${user}**\nУровень: ${level}\nОпыт: ${xp} XP`,
    leaderboardTitle: '🏆 Топ сервера',
    leaderboardEmpty: 'Топ пуст.',
    newsError: 'Ошибка при отправке новости. Убедитесь, что бот имеет права на отправку сообщений в указанный канал.'
  },
  en: {
    userNotFound: 'User not found on the server.',
    noPermission: 'Failed to execute action (insufficient permissions).',
    banned: (user: string, reason: string) => `User **${user}** has been banned.\nReason: *${reason}*`,
    kicked: (user: string, reason: string) => `User **${user}** has been kicked.\nReason: *${reason}*`,
    muted: (user: string, time: string, reason: string) => `User **${user}** has been timed out for ${time}.\nReason: *${reason}*`,
    unmuted: (user: string) => `Timeout for **${user}** has been removed.`,
    warned: (user: string, reason: string) => `User **${user}** has been warned.\nReason: *${reason}*`,
    cleared: (count: number) => `Deleted **${count}** messages.`,
    invalidAmount: 'Please specify an amount between 1 and 100.',
    newsSent: 'News successfully broadcasted!',
    langChanged: 'Bot language successfully changed to English.',
    rankInfo: (user: string, level: number, xp: number) => `**${user}**\nLevel: ${level}\nExperience: ${xp} XP`,
    leaderboardTitle: '🏆 Server Leaderboard',
    leaderboardEmpty: 'Leaderboard is empty.',
    newsError: 'Error sending news. Ensure the bot has permissions to send messages in the target channel.'
  }
};
