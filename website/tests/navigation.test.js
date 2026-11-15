import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteSectionLinks } from '../src/lib/navigation.js';
import { localizeHtml } from '../src/lib/localize.js';

test('new pages preserve their own anchors and retarget old landing destinations', () => {
  const html = rewriteSectionLinks('<html><body><div id="features"></div><a href="#features">Возможности</a><a href="/#download">Скачать</a><a href="#help-update-429">Помощь</a><a href="https://downloads.femboylauncher.ru/a.exe">EXE</a></body></html>');
  assert.match(html, /href="#features"/);
  assert.match(html, /href="\/download\/#download"/);
  assert.match(html, /href="\/help\/#help-update-429"/);
  assert.match(html, /href="https:\/\/downloads.femboylauncher.ru\/a.exe"/);
});
test('English navigation points to the matching English pages', () => {
  const html = localizeHtml(rewriteSectionLinks('<html lang="ru"><body><a href="/#gallery">Интерфейс</a><a href="/download/">Скачать</a><a href="/" data-language-link="ru">RU</a></body></html>'));
  assert.match(html, /href="\/en\/interface\/#gallery"/);
  assert.match(html, /href="\/en\/download\/"/);
  assert.match(html, /href="\/" data-language-link="ru"/);
});
test('legacy links work under a non-root base and unknown anchors are preserved', () => {
  const html = rewriteSectionLinks('<html><body><a href="/launcher/#themes">Themes</a><a href="#custom">Custom</a></body></html>', '/launcher/');
  assert.match(html, /href="\/launcher\/interface\/#themes"/);
  assert.match(html, /href="#custom"/);
});
