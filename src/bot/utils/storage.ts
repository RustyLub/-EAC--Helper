import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type GuildSettings = {
  language?: 'ru' | 'en';
  automod?: {
    antiSpam?: boolean;
    antiInvite?: boolean;
    antiCaps?: boolean;
    badWords?: string[];
  };
  welcome?: { enabled?: boolean; channelId?: string; message?: string };
  leave?: { enabled?: boolean; channelId?: string; message?: string };
  customCommands?: Record<string, string>;
  users?: Record<string, { username?: string; xp?: number }>;
  modules?: Record<string, boolean>;
  updatedAt?: string;
  updatedBy?: string;
  [key: string]: unknown;
};

const DATA_DIR = path.resolve(process.env.EAC_DATA_DIR || path.join(process.cwd(), 'data', 'guilds'));
const pendingWrites = new Map<string, Promise<void>>();

function fileFor(guildId: string): string {
  if (!/^\d{5,25}$/.test(guildId)) throw new Error('Invalid Discord guild ID');
  return path.join(DATA_DIR, `${guildId}.json`);
}

async function readGuild(guildId: string): Promise<GuildSettings> {
  try {
    const raw = await readFile(fileFor(guildId), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as GuildSettings
      : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

async function writeGuild(guildId: string, data: GuildSettings): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const file = fileFor(guildId);
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(temporary, file);
}

async function serialize<T>(guildId: string, operation: () => Promise<T>): Promise<T> {
  const previous = pendingWrites.get(guildId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>(resolve => { release = resolve; });
  pendingWrites.set(guildId, current);
  await previous;
  try {
    return await operation();
  } finally {
    release();
    if (pendingWrites.get(guildId) === current) pendingWrites.delete(guildId);
  }
}

export async function getGuildSettings(guildId: string): Promise<GuildSettings> {
  await (pendingWrites.get(guildId) ?? Promise.resolve());
  return readGuild(guildId);
}

export async function updateGuildSettings(
  guildId: string,
  update: Partial<GuildSettings> | ((current: GuildSettings) => GuildSettings),
): Promise<GuildSettings> {
  return serialize(guildId, async () => {
    const current = await readGuild(guildId);
    const next = typeof update === 'function' ? update(current) : { ...current, ...update };
    await writeGuild(guildId, { ...next, updatedAt: new Date().toISOString() });
    return next;
  });
}

export async function getGuildUserXp(guildId: string, userId: string): Promise<number> {
  const settings = await getGuildSettings(guildId);
  const xp = settings.users?.[userId]?.xp;
  return typeof xp === 'number' && Number.isFinite(xp) ? Math.max(0, xp) : 0;
}

export async function addGuildUserXp(
  guildId: string,
  userId: string,
  username: string,
  amount: number,
): Promise<{ oldXp: number; newXp: number }> {
  return serialize(guildId, async () => {
    const settings = await readGuild(guildId);
    const users = settings.users ?? {};
    const oldXp = typeof users[userId]?.xp === 'number' ? Math.max(0, users[userId].xp!) : 0;
    const newXp = oldXp + amount;
    users[userId] = { ...users[userId], username, xp: newXp };
    await writeGuild(guildId, { ...settings, users, updatedAt: new Date().toISOString() });
    return { oldXp, newXp };
  });
}

export async function getGuildLeaderboard(guildId: string, limit = 10) {
  const settings = await getGuildSettings(guildId);
  return Object.entries(settings.users ?? {})
    .map(([userId, user]) => ({
      userId,
      username: user.username || userId,
      xp: typeof user.xp === 'number' && Number.isFinite(user.xp) ? Math.max(0, user.xp) : 0,
    }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}
