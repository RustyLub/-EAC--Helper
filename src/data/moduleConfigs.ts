export type SettingField = 
  | { type: 'toggle'; id: string; label: string; desc?: string; default?: boolean }
  | { type: 'select'; id: string; label: string; desc?: string; options: string[] }
  | { type: 'channel'; id: string; label: string; desc?: string }
  | { type: 'role'; id: string; label: string; desc?: string }
  | { type: 'textarea'; id: string; label: string; desc?: string; placeholder?: string }
  | { type: 'input'; id: string; label: string; desc?: string; placeholder?: string };

export const moduleSettingsConfig: Record<string, SettingField[]> = {
  levels: [
    { type: 'toggle', id: 'announce_levelup', label: 'Оповещать о повышении уровня', default: true, desc: 'Отправлять сообщение когда пользователь получает новый уровень.' },
    { type: 'channel', id: 'levelup_channel', label: 'Канал для оповещений', desc: 'Если не выбран, сообщение будет отправлено в текущий канал.' },
    { type: 'textarea', id: 'levelup_msg', label: 'Сообщение при повышении', placeholder: 'Поздравляем, {user}, вы достигли {level} уровня!' },
    { type: 'toggle', id: 'stack_roles', label: 'Суммировать роли уровней', default: false, desc: 'Оставлять предыдущие роли за уровни при получении новых.' },
  ],
  tickets: [
    { type: 'channel', id: 'ticket_category', label: 'Категория для тикетов', desc: 'Где будут создаваться каналы тикетов.' },
    { type: 'role', id: 'support_role', label: 'Роль поддержки', desc: 'Пользователи с этой ролью смогут видеть тикеты.' },
    { type: 'textarea', id: 'welcome_message', label: 'Приветственное сообщение в тикете', placeholder: 'Спасибо за обращение! Поддержка скоро вам ответит.' },
    { type: 'toggle', id: 'auto_transcript', label: 'Авто-транскрипт при закрытии', default: true },
  ],
  afk: [
    { type: 'toggle', id: 'change_nickname', label: 'Изменять никнейм', default: true, desc: 'Добавлять [AFK] к нику пользователя.' },
    { type: 'role', id: 'exempt_roles', label: 'Игнорируемые роли', desc: 'Пользователи с этими ролями не смогут использовать AFK.' },
  ],
  auto_purge: [
    { type: 'channel', id: 'purge_channel', label: 'Канал для очистки' },
    { type: 'select', id: 'purge_interval', label: 'Интервал очистки', options: ['Каждый час', 'Каждые 6 часов', 'Каждые 12 часов', 'Каждый день', 'Каждую неделю'] },
    { type: 'input', id: 'keep_messages', label: 'Оставлять последние X сообщений', placeholder: '0' },
  ],
  announcements: [
    { type: 'channel', id: 'announce_channel', label: 'Канал для оповещений' },
    { type: 'toggle', id: 'join_messages', label: 'Оповещения о входе', default: true },
    { type: 'toggle', id: 'leave_messages', label: 'Оповещения о выходе', default: true },
    { type: 'toggle', id: 'ban_messages', label: 'Оповещения о банах', default: false },
  ],
  autoresponder: [
    { type: 'input', id: 'trigger_word', label: 'Слово-триггер', placeholder: 'например: привет' },
    { type: 'textarea', id: 'response_text', label: 'Текст ответа', placeholder: 'Приветствую!' },
    { type: 'toggle', id: 'exact_match', label: 'Точное совпадение', default: false, desc: 'Срабатывать только если сообщение состоит исключительно из слова-триггера.' },
  ],
  reminders: [
    { type: 'toggle', id: 'allow_everyone', label: 'Разрешить всем пользователям', default: true },
    { type: 'role', id: 'restricted_roles', label: 'Запретить для ролей' },
  ],
  autoroles: [
    { type: 'role', id: 'join_role', label: 'Роль при входе', desc: 'Выдается автоматически всем новым пользователям.' },
    { type: 'input', id: 'delay', label: 'Задержка выдачи (в минутах)', placeholder: '0' },
    { type: 'toggle', id: 'restore_roles', label: 'Восстанавливать роли', default: true, desc: 'Возвращать роли пользователю, если он вышел и зашел снова.' },
  ],
  voice_text_linking: [
    { type: 'channel', id: 'category', label: 'Категория для текстовых каналов' },
    { type: 'toggle', id: 'delete_on_leave', label: 'Удалять канал когда все вышли', default: true },
  ],
  moderation: [
    { type: 'role', id: 'mod_role', label: 'Роль модератора' },
    { type: 'channel', id: 'mod_log_channel', label: 'Канал журнала модераторов' },
    { type: 'toggle', id: 'dm_on_punish', label: 'Отправлять ЛС при наказании', default: true },
  ],
  tags: [
    { type: 'role', id: 'create_role', label: 'Роль для создания тегов' },
    { type: 'toggle', id: 'allow_everyone_use', label: 'Разрешить всем использовать теги', default: true },
  ],
  fun: [
    { type: 'toggle', id: 'allow_nsfw', label: 'Разрешить NSFW команды', default: false, desc: 'Работает только в каналах с пометкой NSFW.' },
    { type: 'channel', id: 'disabled_channels', label: 'Отключить в каналах' },
  ],
  slowmode: [
    { type: 'channel', id: 'slowmode_channel', label: 'Канал для установки' },
    { type: 'input', id: 'slowmode_time', label: 'Время медленного режима (в секундах)', placeholder: '5' },
  ],
  auto_message: [
    { type: 'channel', id: 'msg_channel', label: 'Канал для отправки' },
    { type: 'input', id: 'msg_interval', label: 'Интервал (в минутах)', placeholder: '60' },
    { type: 'textarea', id: 'msg_text', label: 'Текст сообщения', placeholder: 'Не забывайте читать правила!' },
  ],
  message_embedder: [
    { type: 'role', id: 'embed_role', label: 'Роль с доступом к созданию', desc: 'Пользователи с этой ролью смогут создавать Embed сообщения.' },
  ],
  reddit: [
    { type: 'input', id: 'subreddit', label: 'Название Subreddit', placeholder: 'например: discordapp' },
    { type: 'channel', id: 'post_channel', label: 'Канал для постов' },
  ],
  auto_delete: [
    { type: 'channel', id: 'delete_channel', label: 'Канал для мониторинга' },
    { type: 'input', id: 'delete_delay', label: 'Задержка удаления (в секундах)', placeholder: '3' },
  ],
  starboard: [
    { type: 'channel', id: 'star_channel', label: 'Канал Starboard', desc: 'Куда будут отправляться лучшие посты.' },
    { type: 'input', id: 'star_count', label: 'Необходимое количество реакций ⭐', placeholder: '3' },
  ],
  autoban: [
    { type: 'textarea', id: 'ban_words', label: 'Бан-слова (через запятую)', desc: 'Пользователь будет забанен при написании любого из этих слов.' },
    { type: 'toggle', id: 'delete_history', label: 'Удалять историю сообщений', default: true },
  ],
  giveaways: [
    { type: 'role', id: 'manager_role', label: 'Роль менеджера розыгрышей' },
    { type: 'toggle', id: 'dm_winner', label: 'Оповещать победителя в ЛС', default: true },
  ],
  twitch: [
    { type: 'input', id: 'twitch_channel', label: 'Имя канала Twitch' },
    { type: 'channel', id: 'notify_channel', label: 'Канал для уведомлений' },
    { type: 'input', id: 'notify_msg', label: 'Сообщение', placeholder: '{streamer} начал трансляцию!' },
  ],
  forms: [
    { type: 'channel', id: 'forms_channel', label: 'Канал для отправки форм' },
    { type: 'channel', id: 'results_channel', label: 'Канал для результатов (для админов)' },
  ],
  youtube: [
    { type: 'input', id: 'youtube_channel', label: 'ID или имя канала YouTube' },
    { type: 'channel', id: 'notify_channel', label: 'Канал для уведомлений' },
  ],
  highlights: [
    { type: 'toggle', id: 'allow_everyone', label: 'Разрешить всем пользователям', default: true, desc: 'Разрешить пользователям настраивать уведомления по своим ключевым словам.' },
  ],
  tiktok: [
    { type: 'input', id: 'tiktok_user', label: 'Имя пользователя TikTok' },
    { type: 'channel', id: 'notify_channel', label: 'Канал для уведомлений' },
  ],
  kick: [
    { type: 'input', id: 'kick_user', label: 'Имя пользователя Kick' },
    { type: 'channel', id: 'notify_channel', label: 'Канал для уведомлений' },
  ],
};
