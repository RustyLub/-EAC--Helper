import test from 'node:test';
import assert from 'node:assert/strict';
import { isModuleEnabled } from './moduleSwitches';

test('module switches default to enabled unless explicitly disabled', () => {
  assert.equal(isModuleEnabled({}, 'moderation'), true);
  assert.equal(isModuleEnabled({ moderation: true }, 'moderation'), true);
  assert.equal(isModuleEnabled({ moderation: false }, 'moderation'), false);
  assert.equal(isModuleEnabled({ announcements: false }, 'announcements'), false);
  assert.equal(isModuleEnabled({ levels: false }, 'levels'), false);
});
