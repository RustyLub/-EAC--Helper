import { ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Shows the interactive help menu.');

const categories = {
  home: {
    label: 'Home',
    emoji: '🏠',
    description: 'Return to the main help menu',
    commands: []
  },
  moderation: {
    label: 'Moderation',
    emoji: '🛡️',
    description: 'View moderation commands',
    commands: [
      { name: 'ban', desc: 'Ban a user from the server.' },
      { name: 'kick', desc: 'Kick a user from the server.' },
      { name: 'mute', desc: 'Mute a user (timeout).' },
      { name: 'warn', desc: 'Warn a user.' },
      { name: 'clear', desc: 'Clear messages in a channel.' }
    ]
  },
  economy: {
    label: 'Economy',
    emoji: '💰',
    description: 'View economy commands',
    commands: [
      { name: 'rank', desc: 'Check your or another user\'s level and XP.' },
      { name: 'leaderboard', desc: 'Show the top users by XP.' }
    ]
  },
  news: {
    label: 'News',
    emoji: '📰',
    description: 'View news commands',
    commands: [
      { name: 'news', desc: 'Publish a news announcement.' }
    ]
  },
  utility: {
    label: 'Utility',
    emoji: '⚙️',
    description: 'View utility commands',
    commands: [
      { name: 'language', desc: 'Set the server language (ru/en).' },
      { name: 'help', desc: 'Shows the interactive help menu.' }
    ]
  }
};

function generateMainEmbed(client: any) {
  const botName = client?.user?.username || "Bot";
  const avatarUrl = client?.user?.displayAvatarURL?.({ size: 1024 });

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`📖 ${botName} Help`)
    .setDescription('Set up your server, pick what to enable, then browse commands below.')
    .addFields(
      {
        name: '🚀 Getting Started',
        value: [
          '**1. Setup Language** — Run `/language` to configure your server language.',
          '**2. Browse commands** — Use the menu below to view categories and commands.'
        ].join('\n'),
        inline: false,
      },
      {
        name: 'ℹ️ How It Works',
        value: [
          '• Commands are categorized for easy navigation.',
          '• Settings are saved per server.',
        ].join('\n'),
        inline: false,
      }
    )
    .setFooter({ text: `Made with ❤️` })
    .setTimestamp();
  
  if (avatarUrl) {
    embed.setThumbnail(avatarUrl);
  }

  return embed;
}

function generateCategoryEmbed(categoryKey: string, appCommands: any) {
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
    .setTitle(`${category.emoji} ${category.label} Commands`)
    .setDescription('Click any command mention below to use it:\n\n**Commands**\n' + commandsText)
    .setFooter({ text: `Made with ❤️` })
    .setTimestamp();
}

function generateComponents(selectedCategory: string) {
  const bugReportButton = new ButtonBuilder()
    .setCustomId('help_bug_report')
    .setLabel("Report Bug")
    .setStyle(ButtonStyle.Danger);

  const supportButton = new ButtonBuilder()
    .setLabel("Support Server")
    .setURL("https://discord.gg/discord")
    .setStyle(ButtonStyle.Link);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
    bugReportButton,
    supportButton,
  ]);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('Select a category to view commands...')
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
  const embed = generateMainEmbed(interaction.client);
  const components = generateComponents('home');

  await interaction.reply({
    embeds: [embed],
    components: components
  });
}

export async function handleSelect(interaction: StringSelectMenuInteraction) {
  const selectedCategory = interaction.values[0];
  
  let embed;
  if (selectedCategory === 'home') {
    embed = generateMainEmbed(interaction.client);
  } else {
    let appCommands = interaction.client.application?.commands.cache;
    if (!appCommands || appCommands.size === 0) {
      appCommands = await interaction.client.application?.commands.fetch();
    }
    embed = generateCategoryEmbed(selectedCategory, appCommands);
  }

  const components = generateComponents(selectedCategory);

  await interaction.update({
    embeds: [embed],
    components: components
  });
}
