import { MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { getGuildLanguage } from './lang';
import { getRuntimeGuild } from './runtime';

import { isModuleEnabled } from './moduleSwitches';
import type { GuardedModule } from './moduleSwitches';
export { isModuleEnabled } from './moduleSwitches';
export type { GuardedModule } from './moduleSwitches';

const moduleNames = {
  ru: { moderation: 'Модерация', announcements: 'Оповещения', levels: 'Система уровней' },
  en: { moderation: 'Moderation', announcements: 'Announcements', levels: 'Leveling' },
} as const;

/** Returns false and responds ephemerally when the feature is disabled for this guild. */
export async function requireModuleEnabled(
  interaction: ChatInputCommandInteraction,
  moduleId: GuardedModule,
): Promise<boolean> {
  if (!interaction.inGuild() || !interaction.guildId) {
    await interaction.reply({
      content: 'Эта команда доступна только на сервере.',
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }

  if (isModuleEnabled(getRuntimeGuild(interaction.guildId).modules, moduleId)) return true;

  const language = await getGuildLanguage(interaction.guildId);
  const name = moduleNames[language][moduleId];
  await interaction.reply({
    content: language === 'ru'
      ? `Модуль «${name}» отключён администратором сервера.`
      : `The ${name} module is disabled by this server's administrator.`,
    flags: MessageFlags.Ephemeral,
  });
  return false;
}
