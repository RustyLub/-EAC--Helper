import { ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getGuildLanguage, translations } from '../../utils/lang';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Shows the interactive help menu.');

function getCategories(lang: 'ru' | 'en') {
  const t = translations[lang];
  return {
    home: {
      label: t.helpHomeLabel,
      emoji: '🏠',
      description: t.helpHomeDesc,
      commands: []
    },
    moderation: {
      label: t.helpModerationLabel,
      emoji: '🛡️',
      description: t.helpModerationDesc,
      commands: [
        { name: 'ban', desc: lang === 'ru' ? 'Забанить пользователя.' : 'Ban a user from the server.' },
        { name: 'kick', desc: lang === 'ru' ? 'Кикнуть пользователя.' : 'Kick a user from the server.' },
        { name: 'mute', desc: lang === 'ru' ? 'Выдать тайм-аут.' : 'Mute a user (timeout).' },
        { name: 'warn', desc: lang === 'ru' ? 'Выдать предупреждение.' : 'Warn a user.' },
        { name: 'clear', desc: lang === 'ru' ? 'Очистить сообщения.' : 'Clear messages in a channel.' }
      ]
    },
    economy: {
      label: t.helpEconomyLabel,
      emoji: '💰',
      description: t.helpEconomyDesc,
      commands: [
        { name: 'rank', desc: lang === 'ru' ? 'Проверить уровень и опыт.' : 'Check your or another user\'s level and XP.' },
        { name: 'leaderboard', desc: lang === 'ru' ? 'Показать топ пользователей.' : 'Show the top users by XP.' }
      ]
    },
    news: {
      label: t.helpNewsLabel,
      emoji: '📰',
      description: t.helpNewsDesc,
      commands: [
        { name: 'news', desc: lang === 'ru' ? 'Опубликовать новость.' : 'Publish a news announcement.' }
      ]
    },
    utility: {
      label: t.helpUtilityLabel,
      emoji: '⚙️',
      description: t.helpUtilityDesc,
      commands: [
        { name: 'language', desc: lang === 'ru' ? 'Установить язык сервера (ru/en).' : 'Set the server language (ru/en).' },
        { name: 'help', desc: lang === 'ru' ? 'Показать интерактивное меню помощи.' : 'Shows the interactive help menu.' }
      ]
    }
  };
}

function generateMainEmbed(client: any, lang: 'ru' | 'en') {
  const t = translations[lang];
  const botName = client?.user?.username || "Bot";
  const avatarUrl = client?.user?.displayAvatarURL?.({ size: 1024 });

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(t.helpMainTitle(botName))
    .setDescription(t.helpMainDesc)
    .addFields(
      {
        name: t.helpGettingStarted,
        value: t.helpGettingStartedValue,
        inline: false,
      },
      {
        name: t.helpHowItWorks,
        value: t.helpHowItWorksValue,
        inline: false,
      }
    )
    .setFooter({ text: `${t.madeWithHeart} • ${new Date().toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}` })
    .setTimestamp();
  
  if (avatarUrl) {
    embed.setThumbnail(avatarUrl);
  }

  return embed;
}

function generateCategoryEmbed(categoryKey: string, appCommands: any, lang: 'ru' | 'en') {
  const t = translations[lang];
  const categories = getCategories(lang);
  const category = categories[categoryKey as keyof typeof categories];
  
  let commandsText = '';
  for (const cmd of category.commands) {
    const appCmd = appCommands.find((c: any) => c.name === cmd.name);
    if (appCmd) {
      commandsText += `</${cmd.name}:${appCmd.id}> · ${cmd.desc}\n`;
    } else {
      commandsText += `\`/${cmd.name}\` · ${cmd.desc}\n`;
    }
  }

  return new EmbedBuilder()
    .setColor('#2b2d31')
    .setTitle(t.helpCategoryTitle(category.emoji, category.label))
    .setDescription(t.helpCategoryDesc + commandsText)
    .setFooter({ text: `${t.madeWithHeart} • ${new Date().toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}` })
    .setTimestamp();
}

function generateComponents(selectedCategory: string, lang: 'ru' | 'en') {
  const t = translations[lang];
  const categories = getCategories(lang);

  const bugReportButton = new ButtonBuilder()
    .setCustomId('help_bug_report')
    .setLabel(t.helpBugReport)
    .setStyle(ButtonStyle.Danger);

  const supportButton = new ButtonBuilder()
    .setLabel(t.helpSupportServer)
    .setURL("https://discord.gg/discord")
    .setStyle(ButtonStyle.Link);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
    bugReportButton,
    supportButton,
  ]);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder(t.helpSelectCategoryPlaceholder)
    .addOptions(
      Object.entries(categories).map(([key, cat]) => ({
        label: cat.label,
        value: key,
        description: cat.description,
        emoji: cat.emoji,
        default: key === selectedCategory
      }))
    );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  return [buttonRow, selectRow];
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const lang = await getGuildLanguage(interaction.guildId!);
  const embed = generateMainEmbed(interaction.client, lang);
  const components = generateComponents('home', lang);

  await interaction.reply({
    embeds: [embed],
    components: components
  });
}

export async function handleSelect(interaction: StringSelectMenuInteraction) {
  const lang = await getGuildLanguage(interaction.guildId!);
  const selectedCategory = interaction.values[0];
  
  let embed;
  if (selectedCategory === 'home') {
    embed = generateMainEmbed(interaction.client, lang);
  } else {
    let appCommands = interaction.client.application?.commands.cache;
    if (!appCommands || appCommands.size === 0) {
      appCommands = await interaction.client.application?.commands.fetch();
    }
    embed = generateCategoryEmbed(selectedCategory, appCommands, lang);
  }

  const components = generateComponents(selectedCategory, lang);

  await interaction.update({
    embeds: [embed],
    components: components
  });
}
