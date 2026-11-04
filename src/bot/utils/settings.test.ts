import test from 'node:test';
import assert from 'node:assert/strict';
import { getRuntimeGuild, resetRuntimeGuilds } from './runtime';
import { applySettingsPatch, serializeSettings, SUPPORTED_MODULES } from './settings';

const ID = '123456789012345678';

test('serializeSettings возвращает все поддерживаемые модули включёнными по умолчанию', () => {
  resetRuntimeGuilds();
  const result = serializeSettings('g', getRuntimeGuild('g'));
  assert.deepEqual(Object.keys(result.modules).sort(), [...SUPPORTED_MODULES].sort());
  assert.ok(Object.values(result.modules).every((enabled) => enabled === true));
  assert.equal(result.announcementChannelId, '');
  assert.equal(result.welcome.enabled, false);
});

test('некорректный запрос не меняет состояние вообще (проверка до записи)', () => {
  resetRuntimeGuilds();
  const state = getRuntimeGuild('g');
  const error = applySettingsPatch(state, {
    modules: { levels: false },
    automod: { spamLimit: 9999 },
  });
  assert.equal(error, 'Invalid automod settings');
  assert.equal(state.modules.levels, true, 'модули не должны меняться, если automod невалиден');
  assert.equal(state.automod.spamLimit, 5);
});

test('валидный запрос применяется целиком', () => {
  resetRuntimeGuilds();
  const state = getRuntimeGuild('g');
  const error = applySettingsPatch(state, {
    modules: { levels: false },
    automod: { antiSpam: true, badWords: ['  Плохо ', '', 'ЗЛО'], spamLimit: 7 },
    levels: { xpPerMessage: 20, cooldownSeconds: 30 },
    welcome: { enabled: true, channelId: ID, message: 'Привет, {user}!' },
    customCommands: { hello: '  Привет!  ' },
    announcementChannelId: ID,
  });
  assert.equal(error, null);
  assert.equal(state.modules.levels, false);
  assert.equal(state.modules.moderation, true);
  assert.equal(state.automod.antiSpam, true);
  assert.deepEqual(state.automod.badWords, ['плохо', 'зло']);
  assert.equal(state.automod.spamLimit, 7);
  assert.equal(state.automod.spamWindowMs, 5000, 'нетронутые поля сохраняются');
  assert.equal(state.levels.xpPerMessage, 20);
  assert.equal(state.levels.xpMultiplier, 100);
  assert.deepEqual(state.welcome, { enabled: true, channelId: ID, message: 'Привет, {user}!' });
  assert.deepEqual(state.customCommands, { hello: 'Привет!' });
  assert.equal(state.announcementChannelId, ID);
});

test('неизвестные ключи не попадают в состояние', () => {
  resetRuntimeGuilds();
  const state = getRuntimeGuild('g');
  assert.equal(applySettingsPatch(state, { automod: { antiSpam: true, evil: 'x' }, levels: { hack: 1 } }), null);
  assert.equal('evil' in state.automod, false);
  assert.equal('hack' in state.levels, false);
});

test('неизвестный модуль и нестрогие типы отклоняются', () => {
  resetRuntimeGuilds();
  const state = getRuntimeGuild('g');
  assert.match(String(applySettingsPatch(state, { modules: { tickets: true } })), /Invalid module setting: tickets/);
  assert.match(String(applySettingsPatch(state, { modules: { levels: 'yes' } })), /Invalid module setting: levels/);
  assert.equal(applySettingsPatch(state, 'строка'), 'Expected a JSON object');
  assert.equal(applySettingsPatch(state, { modules: [] }), 'Expected a modules object');
});

test('ID каналов должны быть snowflake или пустой строкой', () => {
  resetRuntimeGuilds();
  const state = getRuntimeGuild('g');
  assert.equal(applySettingsPatch(state, { announcementChannelId: 'abc' }), 'Invalid announcement channel');
  assert.equal(applySettingsPatch(state, { welcome: { enabled: true, channelId: '12' } }), 'Invalid welcome channel ID');
  assert.equal(applySettingsPatch(state, { announcementChannelId: '' }), null);
});

test('пользовательские команды: лимиты и запрещённые имена', () => {
  resetRuntimeGuilds();
  const state = getRuntimeGuild('g');
  assert.equal(applySettingsPatch(state, { customCommands: { 'Bad Name': 'x' } }), 'Invalid custom commands');
  assert.equal(applySettingsPatch(state, { customCommands: { ok: '   ' } }), 'Invalid custom commands');
  assert.equal(applySettingsPatch(state, JSON.parse('{"customCommands":{"__proto__":"x"}}')), 'Invalid custom commands');
  const tooMany = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`c${i}`, 'x']));
  assert.equal(applySettingsPatch(state, { customCommands: tooMany }), 'Invalid custom commands');
  assert.deepEqual(state.customCommands, {});
});
