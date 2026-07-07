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
    newsError: 'Ошибка при отправке новости. Убедитесь, что бот имеет права на отправку сообщений в указанный канал.',

    helpMainTitle: (botName: string) => `📖 Помощь по ${botName}`,
    helpMainDesc: 'Настройте ваш сервер, выберите, что включить, затем просмотрите команды ниже.',
    helpGettingStarted: '🚀 Начало работы',
    helpGettingStartedValue: '**1. Настройка языка** — Используйте `/language` для настройки языка сервера.\n**2. Просмотр команд** — Используйте меню ниже для просмотра категорий и команд.',
    helpHowItWorks: 'ℹ️ Как это работает',
    helpHowItWorksValue: '• Команды разделены на категории для удобной навигации.\n• Настройки сохраняются для каждого сервера индивидуально.',
    helpSelectCategoryPlaceholder: 'Выберите категорию...',
    helpHomeLabel: 'Главная',
    helpHomeDesc: 'Вернуться в главное меню',
    helpModerationLabel: 'Модерация',
    helpModerationDesc: 'Команды модерации',
    helpEconomyLabel: 'Экономика',
    helpEconomyDesc: 'Команды экономики',
    helpNewsLabel: 'Новости',
    helpNewsDesc: 'Команды новостей',
    helpUtilityLabel: 'Утилиты',
    helpUtilityDesc: 'Полезные команды',
    helpCategoryTitle: (emoji: string, label: string) => `${emoji} Команды: ${label}`,
    helpCategoryDesc: 'Нажмите на любую команду ниже, чтобы использовать её:\n\n**Команды**\n',
    helpBugReport: 'Сообщить о баге',
    helpSupportServer: 'Сервер поддержки',
    madeWithHeart: 'Сделано с ❤️'
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
    newsError: 'Error sending news. Ensure the bot has permissions to send messages in the target channel.',

    helpMainTitle: (botName: string) => `📖 ${botName} Help`,
    helpMainDesc: 'Set up your server, pick what to enable, then browse commands below.',
    helpGettingStarted: '🚀 Getting Started',
    helpGettingStartedValue: '**1. Setup Language** — Run `/language` to configure your server language.\n**2. Browse commands** — Use the menu below to view categories and commands.',
    helpHowItWorks: 'ℹ️ How It Works',
    helpHowItWorksValue: '• Commands are categorized for easy navigation.\n• Settings are saved per server.',
    helpSelectCategoryPlaceholder: 'Select a category...',
    helpHomeLabel: 'Home',
    helpHomeDesc: 'Return to the main help menu',
    helpModerationLabel: 'Moderation',
    helpModerationDesc: 'View moderation commands',
    helpEconomyLabel: 'Economy',
    helpEconomyDesc: 'View economy commands',
    helpNewsLabel: 'News',
    helpNewsDesc: 'View news commands',
    helpUtilityLabel: 'Utility',
    helpUtilityDesc: 'View utility commands',
    helpCategoryTitle: (emoji: string, label: string) => `${emoji} ${label} Commands`,
    helpCategoryDesc: 'Click any command mention below to use it:\n\n**Commands**\n',
    helpBugReport: 'Report Bug',
    helpSupportServer: 'Support Server',
    madeWithHeart: 'Made with ❤️'
  }
};
