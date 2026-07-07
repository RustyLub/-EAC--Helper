import * as banCommand from './commands/moderation/ban';
import * as kickCommand from './commands/moderation/kick';
import * as muteCommand from './commands/moderation/mute';
import * as warnCommand from './commands/moderation/warn';
import * as clearCommand from './commands/moderation/clear';
import * as newsCommand from './commands/news/news';
import * as rankCommand from './commands/economy/rank';
import * as leaderboardCommand from './commands/economy/leaderboard';
import * as languageCommand from './commands/utility/language';
import * as helpCommand from './commands/utility/help';

export const commands = [
  banCommand,
  kickCommand,
  muteCommand,
  warnCommand,
  clearCommand,
  newsCommand,
  rankCommand,
  leaderboardCommand,
  languageCommand,
  helpCommand
];

import * as readyEvent from './events/ready';
import * as interactionCreateEvent from './events/interactionCreate';
import * as messageCreateEvent from './events/messageCreate';

export const events = [
  readyEvent,
  interactionCreateEvent,
  messageCreateEvent
];
