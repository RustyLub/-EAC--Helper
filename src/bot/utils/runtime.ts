export type AutomodSettings = { antiSpam: boolean; antiInvite: boolean; antiCaps: boolean; badWords: string[] };
export type GreetingSettings = { enabled: boolean; channelId?: string; message?: string };
export type RuntimeGuild = {
  language: 'ru' | 'en';
  automod: AutomodSettings;
  customCommands: Record<string, string>;
  welcome?: GreetingSettings;
  leave?: GreetingSettings;
  users: Record<string, { username: string; xp: number }>;
  modules: Record<string, boolean>;
};

const guilds = new Map<string, RuntimeGuild>();
const defaults = (): RuntimeGuild => ({
  language: 'ru',
  automod: { antiSpam: false, antiInvite: false, antiCaps: false, badWords: [] },
  customCommands: {},
  users: {},
  modules: { moderation: true, automod: true, welcome: true, levels: true, 'custom-commands': true, announcements: true },
});

export function getRuntimeGuild(guildId: string): RuntimeGuild {
  let data = guilds.get(guildId);
  if (!data) { data = defaults(); guilds.set(guildId, data); }
  return data;
}
export function resetRuntimeGuilds(): void { guilds.clear(); }
