import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, MessageFlags,
  SectionBuilder, TextDisplayBuilder, type ButtonInteraction, type ChatInputCommandInteraction,
} from 'discord.js';
import { getGuildLanguage } from '../../utils/lang';
type DashboardPage = 'home' | 'moderation' | 'automod' | 'greetings' | 'economy' | 'commands' | 'settings';
const copy = {
  ru: { title: '## EAC Helper — панель управления', subtitle: 'Выберите блок. Панель обновляется в этом же сообщении.', moderation: '### 🛡️ Модерация\nБан, кик, мут, предупреждения и очистка сообщений.', automod: '### 🤖 Автомодерация\nАнтиспам, блокировка приглашений, капса и запрещённых слов.', greetings: '### 👋 Приветствия\nНастройка сообщений при входе и выходе участников.', economy: '### 🏆 Экономика\nОпыт, уровни и таблица лидеров.', commands: '### ⚙️ Пользовательские команды\nСоздание, просмотр и удаление собственных команд.', settings: '### 🔧 Настройки сервера\nЯзык, функции бота и параметры сервера.', back: '← Главное меню', open: 'Открыть', settingsTitle: '## 🔧 Настройки сервера', settingsText: 'Выберите настройку. Для изменения используйте соответствующую команду ниже.', automodHint: '**Автомодерация**\n`/automod` — включить или отключить фильтры и настроить список запрещённых слов.', greetingsHint: '**Приветствия**\n`/greetings` — настроить канал, текст и включение приветствий/сообщений об уходе.', languageHint: '**Язык**\n`/language` — переключить язык бота для этого сервера.', moderationHint: '**Модерация**\n`/ban`, `/kick`, `/mute`, `/warn`, `/clear`.', economyHint: '**Экономика**\n`/rank` и `/leaderboard`.', commandsHint: '**Пользовательские команды**\n`/customcommand` — создать, удалить или просмотреть команды.', noGuild: 'Панель доступна только на сервере.', noPermission: 'Для управления панелью нужны права администратора.', expired: 'Эта панель больше не активна. Выполните `/menu` заново.' },
  en: { title: '## EAC Helper — Control Panel', subtitle: 'Choose a block. The panel updates in this same message.', moderation: '### 🛡️ Moderation\nBan, kick, timeout, warnings and message cleanup.', automod: '### 🤖 Auto moderation\nAnti-spam, invite blocking, caps and blocked words.', greetings: '### 👋 Greetings\nConfigure welcome and leave messages.', economy: '### 🏆 Economy\nExperience, levels and leaderboard.', commands: '### ⚙️ Custom commands\nCreate, view and delete custom commands.', settings: '### 🔧 Server settings\nLanguage, bot features and server options.', back: '← Main menu', open: 'Open', settingsTitle: '## 🔧 Server settings', settingsText: 'Choose a setting. Use the matching command below to change it.', automodHint: '**Auto moderation**\n`/automod` — toggle filters and manage blocked words.', greetingsHint: '**Greetings**\n`/greetings` — configure channel, text and welcome/leave messages.', languageHint: '**Language**\n`/language` — change the bot language for this server.', moderationHint: '**Moderation**\n`/ban`, `/kick`, `/mute`, `/warn`, `/clear`.', economyHint: '**Economy**\n`/rank` and `/leaderboard`.', commandsHint: '**Custom commands**\n`/customcommand` — create, delete or list commands.', noGuild: 'This panel is only available in a server.', noPermission: 'Administrator permission is required to manage this panel.', expired: 'This panel has expired. Run `/menu` again.' }
} as const;
function button(customId: string, label: string) { return new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(ButtonStyle.Secondary); }
function section(content: string, customId: string, label: string) { return new SectionBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(content)).setButtonAccessory(button(customId, label)); }
export function buildDashboard(page: DashboardPage, language: 'ru' | 'en') {
  const t = copy[language]; const container = new ContainerBuilder().setAccentColor(0x5865F2);
  if (page === 'home') {
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(t.title), new TextDisplayBuilder().setContent(t.subtitle));
    container.addSectionComponents(section(t.moderation, 'eac_dashboard:moderation', t.open), section(t.automod, 'eac_dashboard:automod', t.open), section(t.greetings, 'eac_dashboard:greetings', t.open), section(t.economy, 'eac_dashboard:economy', t.open), section(t.commands, 'eac_dashboard:commands', t.open), section(t.settings, 'eac_dashboard:settings', t.open));
  } else {
    const content: Record<Exclude<DashboardPage, 'home'>, string> = { moderation: t.moderationHint, automod: t.automodHint, greetings: t.greetingsHint, economy: t.economyHint, commands: t.commandsHint, settings: [t.settingsText, t.automodHint, t.greetingsHint, t.languageHint].join('\n\n') };
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(page === 'settings' ? t.settingsTitle : `## ${page[0].toUpperCase()}${page.slice(1)}`), new TextDisplayBuilder().setContent(content[page]));
    container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(button('eac_dashboard:home', t.back)));
  }
  return container;
}
export async function showDashboard(interaction: ChatInputCommandInteraction, page: DashboardPage) {
  if (!interaction.inGuild() || !interaction.guildId) { await interaction.reply({ content: copy.ru.noGuild, flags: MessageFlags.Ephemeral }); return; }
  if (!interaction.memberPermissions?.has('Administrator')) { await interaction.reply({ content: copy.ru.noPermission, flags: MessageFlags.Ephemeral }); return; }
  const language = await getGuildLanguage(interaction.guildId);
  await interaction.reply({ components: [buildDashboard(page, language)], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
}
export async function handleDashboardButton(interaction: ButtonInteraction) {
  if (!interaction.customId.startsWith('eac_dashboard:')) return false;
  if (!interaction.inGuild() || !interaction.guildId) { await interaction.reply({ content: copy.ru.noGuild, flags: MessageFlags.Ephemeral }); return true; }
  if (!interaction.memberPermissions?.has('Administrator')) { await interaction.reply({ content: copy.ru.noPermission, flags: MessageFlags.Ephemeral }); return true; }
  const page = interaction.customId.slice('eac_dashboard:'.length) as DashboardPage;
  const allowed: DashboardPage[] = ['home', 'moderation', 'automod', 'greetings', 'economy', 'commands', 'settings'];
  if (!allowed.includes(page)) { await interaction.reply({ content: copy.ru.expired, flags: MessageFlags.Ephemeral }); return true; }
  const language = await getGuildLanguage(interaction.guildId);
  await interaction.update({ components: [buildDashboard(page, language)] }); return true;
}