import test from 'node:test';
import assert from 'node:assert/strict';
import { getRuntimeGuild, resetRuntimeGuilds } from './runtime';

test('guild state is isolated and defaults to memory-only module settings', () => {
  resetRuntimeGuilds();

  const first = getRuntimeGuild('guild-one');
  const second = getRuntimeGuild('guild-two');

  assert.notEqual(first, second);
  assert.equal(first.language, 'ru');
  assert.equal(first.modules.moderation, true);
  assert.equal(first.modules.automod, true);
  assert.equal(first.modules.welcome, true);
  assert.equal(first.modules.levels, true);
  assert.equal(first.modules['custom-commands'], true);
  assert.equal(first.modules.announcements, true);

  first.language = 'en';
  first.modules.levels = false;
  first.users['user-one'] = { username: 'Member', xp: 75 };
  first.warnings['user-one'] = [{
    reason: 'Test warning',
    createdAt: new Date(0).toISOString(),
    moderatorId: 'moderator-one',
    moderatorTag: 'Moderator',
  }];

  assert.equal(second.language, 'ru');
  assert.equal(second.modules.levels, true);
  assert.equal(Object.keys(second.users).length, 0);
  assert.equal(Object.keys(second.warnings).length, 0);
});

test('resetting runtime state clears all guild data like a process restart', () => {
  resetRuntimeGuilds();
  const guild = getRuntimeGuild('guild-restart');
  guild.language = 'en';
  guild.users['user-one'] = { username: 'Member', xp: 150 };
  guild.customCommands['!hello'] = 'Hello';
  guild.warnings['user-one'] = [{
    reason: 'Temporary',
    createdAt: new Date(0).toISOString(),
    moderatorId: 'moderator-one',
    moderatorTag: 'Moderator',
  }];

  resetRuntimeGuilds();
  const restarted = getRuntimeGuild('guild-restart');

  assert.equal(restarted.language, 'ru');
  assert.deepEqual(restarted.users, {});
  assert.deepEqual(restarted.customCommands, {});
  assert.deepEqual(restarted.warnings, {});
});
