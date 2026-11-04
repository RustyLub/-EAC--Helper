import type { AutomodSettings, GreetingSettings, LevelsSettings, RuntimeGuild } from './runtime';

/** Модули, которые можно включать и выключать из веб-панели. */
export const SUPPORTED_MODULES = [
  'moderation', 'automod', 'welcome', 'levels', 'custom-commands', 'announcements',
] as const;

export const MAX_CUSTOM_COMMANDS = 100;
/** Имя пользовательской команды (без `!`). `__proto__` запрещён намеренно. */
export const CUSTOM_COMMAND_NAME = /^(?!__proto__$)[a-z0-9_-]{1,32}$/;
const SNOWFLAKE = /^\d{17,20}$/;

export const DEFAULT_WELCOME: GreetingSettings = {
  enabled: false, channelId: '', message: 'Добро пожаловать, {user}, на сервер {server}!',
};
export const DEFAULT_LEAVE: GreetingSettings = {
  enabled: false, channelId: '', message: '{user} покинул сервер.',
};

type Obj = Record<string, unknown>;
const isObj = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const isChannelId = (value: unknown): value is string =>
  typeof value === 'string' && (value === '' || SNOWFLAKE.test(value));

/** Полное представление настроек сервера для веб-панели. */
export function serializeSettings(guildId: string, state: RuntimeGuild) {
  return {
    guildId,
    modules: Object.fromEntries(SUPPORTED_MODULES.map((id) => [id, state.modules[id] !== false])),
    automod: state.automod,
    levels: state.levels,
    welcome: state.welcome ?? DEFAULT_WELCOME,
    leave: state.leave ?? DEFAULT_LEAVE,
    customCommands: state.customCommands,
    announcementChannelId: state.announcementChannelId ?? '',
  };
}

/**
 * Проверяет ВСЕ поля запроса и только потом записывает изменения в состояние сервера.
 * Возвращает текст ошибки, если запрос некорректен (состояние при этом не меняется),
 * или null при успехе. Неизвестные ключи игнорируются и в состояние не попадают.
 */
export function applySettingsPatch(state: RuntimeGuild, body: unknown): string | null {
  if (!isObj(body)) return 'Expected a JSON object';
  const writes: Array<() => void> = [];

  if (body.modules !== undefined) {
    if (!isObj(body.modules)) return 'Expected a modules object';
    const updates: Record<string, boolean> = {};
    for (const [id, enabled] of Object.entries(body.modules)) {
      if (!(SUPPORTED_MODULES as readonly string[]).includes(id) || typeof enabled !== 'boolean') {
        return `Invalid module setting: ${id}`;
      }
      updates[id] = enabled;
    }
    writes.push(() => { Object.assign(state.modules, updates); });
  }

  if (body.automod !== undefined) {
    const input = body.automod;
    if (!isObj(input)) return 'Invalid automod settings';
    const next: AutomodSettings = { ...state.automod };
    for (const key of ['antiSpam', 'antiInvite', 'antiCaps'] as const) {
      const value = input[key];
      if (value === undefined) continue;
      if (typeof value !== 'boolean') return 'Invalid automod settings';
      next[key] = value;
    }
    if (input.badWords !== undefined) {
      const words = input.badWords;
      if (!Array.isArray(words) || words.length > 100 || words.some((w) => typeof w !== 'string' || w.length > 80)) {
        return 'Invalid automod settings';
      }
      next.badWords = (words as string[]).map((w) => w.trim().toLowerCase()).filter(Boolean);
    }
    if (input.spamLimit !== undefined) {
      if (!isInt(input.spamLimit, 2, 20)) return 'Invalid automod settings';
      next.spamLimit = input.spamLimit;
    }
    if (input.spamWindowMs !== undefined) {
      if (!isInt(input.spamWindowMs, 1000, 30000)) return 'Invalid automod settings';
      next.spamWindowMs = input.spamWindowMs;
    }
    if (input.timeoutMs !== undefined) {
      if (!isInt(input.timeoutMs, 0, 2_419_200_000)) return 'Invalid automod settings';
      next.timeoutMs = input.timeoutMs;
    }
    writes.push(() => { state.automod = next; });
  }

  if (body.levels !== undefined) {
    const input = body.levels;
    if (!isObj(input)) return 'Invalid levels settings';
    const next: LevelsSettings = { ...state.levels };
    if (input.xpPerMessage !== undefined) {
      if (!isInt(input.xpPerMessage, 1, 1000)) return 'Invalid levels settings';
      next.xpPerMessage = input.xpPerMessage;
    }
    if (input.cooldownSeconds !== undefined) {
      if (!isInt(input.cooldownSeconds, 5, 3600)) return 'Invalid levels settings';
      next.cooldownSeconds = input.cooldownSeconds;
    }
    if (input.xpMultiplier !== undefined) {
      if (!isInt(input.xpMultiplier, 10, 10000)) return 'Invalid levels settings';
      next.xpMultiplier = input.xpMultiplier;
    }
    if (input.levelUpMessage !== undefined) {
      if (typeof input.levelUpMessage !== 'string' || input.levelUpMessage.length > 500) return 'Invalid levels settings';
      next.levelUpMessage = input.levelUpMessage;
    }
    writes.push(() => { state.levels = next; });
  }

  for (const key of ['welcome', 'leave'] as const) {
    const input = body[key];
    if (input === undefined) continue;
    if (!isObj(input) || typeof input.enabled !== 'boolean') return `Invalid ${key} settings`;
    const next: GreetingSettings = { ...(state[key] ?? {}), enabled: input.enabled };
    if (input.channelId !== undefined) {
      if (!isChannelId(input.channelId)) return `Invalid ${key} channel ID`;
      next.channelId = input.channelId;
    }
    if (input.message !== undefined) {
      if (typeof input.message !== 'string' || input.message.length > 1800) return `Invalid ${key} settings`;
      next.message = input.message;
    }
    writes.push(() => { state[key] = next; });
  }

  if (body.customCommands !== undefined) {
    const input = body.customCommands;
    if (!isObj(input)) return 'Invalid custom commands';
    const entries = Object.entries(input);
    if (entries.length > MAX_CUSTOM_COMMANDS) return 'Invalid custom commands';
    const next: Record<string, string> = {};
    for (const [name, value] of entries) {
      if (!CUSTOM_COMMAND_NAME.test(name) || typeof value !== 'string' || !value.trim() || value.length > 1800) {
        return 'Invalid custom commands';
      }
      next[name] = value.trim();
    }
    writes.push(() => { state.customCommands = next; });
  }

  if (body.announcementChannelId !== undefined) {
    if (!isChannelId(body.announcementChannelId)) return 'Invalid announcement channel';
    const channelId = body.announcementChannelId;
    writes.push(() => { state.announcementChannelId = channelId; });
  }

  for (const write of writes) write();
  return null;
}
