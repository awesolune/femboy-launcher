// Адрес резервной публикации на GitHub: одно и то же место в updates.github (publish-github.ps1, setup-github-token.ps1,
// запасная ссылка updater.js) и в build.publish (electron-builder). Канонический репозиторий — awesolune/femboy-launcher.
const test = require('node:test');
const assert = require('node:assert');
const pkg = require('../package.json');

test('updates.github и build.publish указывают на канонический репозиторий', () => {
  const gh = pkg.build.publish.find((p) => p.provider === 'github');
  assert.equal(pkg.updates.github, 'awesolune/femboy-launcher');
  assert.equal(`${gh.owner}/${gh.repo}`, pkg.updates.github);
  assert.doesNotMatch(JSON.stringify(pkg), /EternalPorter16/);
});
