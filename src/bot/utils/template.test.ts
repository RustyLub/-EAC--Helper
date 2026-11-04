import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTemplate } from './template';

test('renderTemplate подставляет известные плейсхолдеры', () => {
  assert.equal(
    renderTemplate('Привет, {user}! Ты {membercount}-й на {server}.', { user: '<@1>', membercount: '42', server: 'EAC' }),
    'Привет, <@1>! Ты 42-й на EAC.',
  );
});

test('renderTemplate оставляет неизвестные плейсхолдеры без изменений', () => {
  assert.equal(renderTemplate('{user} {unknown}', { user: 'A' }), 'A {unknown}');
});

test('renderTemplate вставляет значения буквально, без $-последовательностей String.replace', () => {
  assert.equal(renderTemplate('Сервер: {server}', { server: 'A$&B$1C$$' }), 'Сервер: A$&B$1C$$');
});

test('renderTemplate не обращается к прототипу объекта значений', () => {
  assert.equal(renderTemplate('{constructor} {toString}', {}), '{constructor} {toString}');
});

test('renderTemplate заменяет все вхождения', () => {
  assert.equal(renderTemplate('{user}, {user}!', { user: 'X' }), 'X, X!');
});
