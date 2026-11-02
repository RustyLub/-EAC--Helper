import {
  ChatInputCommandInteraction,
  GuildMember,
  PermissionResolvable,
  PermissionsBitField,
} from 'discord.js';

export type ModerationTargetResult =
  | { ok: true; target: GuildMember }
  | { ok: false; message: string };

export async function resolveModerationTarget(
  interaction: ChatInputCommandInteraction,
  targetId: string,
  botPermission: PermissionResolvable,
): Promise<ModerationTargetResult> {
  if (!interaction.inGuild() || !interaction.guild) {
    return { ok: false, message: 'Эта команда доступна только на сервере.' };
  }

  const guild = interaction.guild;
  const actor = await guild.members.fetch(interaction.user.id).catch(() => null);
  const bot = await guild.members.fetchMe().catch(() => null);
  const target = await guild.members.fetch(targetId).catch(() => null);

  if (!actor || !bot || !target) {
    return { ok: false, message: 'Не удалось получить участника или данные бота.' };
  }
  if (target.id === interaction.user.id) {
    return { ok: false, message: 'Нельзя применить эту команду к самому себе.' };
  }
  if (target.id === bot.id) {
    return { ok: false, message: 'Нельзя применить эту команду к самому боту.' };
  }
  if (target.id === guild.ownerId) {
    return { ok: false, message: 'Нельзя применить эту команду к владельцу сервера.' };
  }
  if (interaction.user.id !== guild.ownerId && actor.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
    return { ok: false, message: 'Ваша высшая роль должна быть выше роли выбранного участника.' };
  }
  if (bot.roles.highest.comparePositionTo(target.roles.highest) <= 0) {
    return { ok: false, message: 'Роль бота должна быть выше роли выбранного участника.' };
  }
  if (!actor.permissions.has(botPermission)) {
    return { ok: false, message: 'У вас недостаточно прав для этой команды.' };
  }
  if (!bot.permissions.has(botPermission)) {
    return { ok: false, message: 'У бота недостаточно прав для этой команды.' };
  }
  return { ok: true, target };
}

export function safeReason(reason: string | null, fallback = 'Причина не указана'): string {
  return (reason?.trim() || fallback).slice(0, 500);
}
