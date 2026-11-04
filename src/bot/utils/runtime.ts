export type AutomodSettings = {
  antiSpam: boolean;
  antiInvite: boolean;
  antiCaps: boolean;
  badWords: string[];
  spamLimit: number;
  spamWindowMs: number;
  timeoutMs: number;
};
export type GreetingSettings = { enabled: boolean; channelId?: string; message?: string };
export type LevelsSettings = { xpPerMessage: number; cooldownSeconds: number; xpMultiplier: number; levelUpMessage: string };
export type RuntimeGuild = {
  language: 'ru' | 'en';
  automod: AutomodSettings;
  levels: LevelsSettings;
  customCommands: Record<string, string>;
  welcome?: GreetingSettings;
  leave?: GreetingSettings;
  announcementChannelId?: string;
  users: Record<string, { username: string; xp: number }>;
  warnings: Record<string, Array<{ reason: string; createdAt: string; moderatorId: string; moderatorTag: string }>>;
  modules: Record<string, boolean>;
};

/** Сообщение о повышении уровня по умолчанию (используется и для выбора английской версии). */
export const DEFAULT_LEVEL_UP_MESSAGE = 'Поздравляем, {user}! Вы достигли {level} уровня!';

const guilds = new Map<string, RuntimeGuild>();
const defaults = (): RuntimeGuild => ({
  language: 'ru',
  automod: { antiSpam: false, antiInvite: false, antiCaps: false, badWords: [], spamLimit: 5, spamWindowMs: 5000, timeoutMs: 60000 },
  levels: { xpPerMessage: 15, cooldownSeconds: 60, xpMultiplier: 100, levelUpMessage: DEFAULT_LEVEL_UP_MESSAGE },
  customCommands: {},
  users: {},
  warnings: {},
  modules: { moderation: true, automod: true, welcome: true, levels: true, 'custom-commands': true, announcements: true },
});

export function getRuntimeGuild(guildId: string): RuntimeGuild {
  let data = guilds.get(guildId);
  if (!data) { data = defaults(); guilds.set(guildId, data); }
  return data;
}
export function resetRuntimeGuilds(): void { guilds.clear(); }
