// Рекурсивный fs.rmSync на Windows (src/core/rmsync-compat.js): ссылку удаляет как ссылку и в чужую папку не заходит,
// файлы «только чтение» удаляет, force/ENOENT как у Node. Родной rmSync в Electron 45 первое и второе нарушает.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
require('../src/core/rmsync-compat');
const win = process.platform === 'win32';
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));

test('junction внутри удаляемой папки: чужие файлы остаются, в том числе «только чтение»', { skip: !win }, (t) => {
  const outside = tmp('fl-rm-out-');
  const keep = path.join(outside, 'keep.txt');
  const ro = path.join(outside, 'ro.txt');
  fs.writeFileSync(keep, 'чужой файл');
  fs.writeFileSync(ro, 'чужой, только чтение');
  fs.chmodSync(ro, 0o444);
  t.after(() => { try { fs.chmodSync(ro, 0o666); } catch {} fs.rmSync(outside, { recursive: true, force: true }); });

  const root = tmp('fl-rm-');
  fs.mkdirSync(path.join(root, 'a', 'b'), { recursive: true });
  for (const f of ['a/x.txt', 'a/b/y.txt']) {
    fs.writeFileSync(path.join(root, f), 'x');
    fs.chmodSync(path.join(root, f), 0o444);
  }
  fs.symlinkSync(outside, path.join(root, 'a', 'link'), 'junction');

  fs.rmSync(root, { recursive: true, force: true });
  assert.equal(fs.existsSync(root), false, 'папка удалена целиком');
  assert.equal(fs.readFileSync(keep, 'utf8'), 'чужой файл', 'файл по ссылке на месте');
  assert.equal(fs.existsSync(ro), true);
  assert.equal(fs.statSync(ro).mode & 0o200, 0, '«только чтение» у чужого файла не снято');
});

test('удаление самой ссылки-junction не трогает цель', { skip: !win }, (t) => {
  const outside = tmp('fl-rm-out2-');
  fs.writeFileSync(path.join(outside, 'k.txt'), 'k');
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  const root = tmp('fl-rm2-');
  const link = path.join(root, 'link');
  fs.symlinkSync(outside, link, 'junction');
  fs.rmSync(link, { recursive: true, force: true });
  assert.equal(fs.existsSync(link), false);
  assert.equal(fs.existsSync(path.join(outside, 'k.txt')), true);
  fs.rmSync(root, { recursive: true });
});

test('force и отсутствующий путь — как у Node; без recursive — родное поведение', () => {
  const missing = path.join(os.tmpdir(), 'fl-rm-missing-' + process.pid + '-' + Date.now());
  fs.rmSync(missing, { recursive: true, force: true });
  assert.throws(() => fs.rmSync(missing, { recursive: true }), { code: 'ENOENT' });
  const root = tmp('fl-rm-nr-');
  fs.writeFileSync(path.join(root, 'z.txt'), 'z');
  assert.throws(() => fs.rmSync(root), (e) => ['ERR_FS_EISDIR', 'EISDIR', 'EPERM'].includes(e.code));
  fs.rmSync(path.join(root, 'z.txt'));
  fs.rmSync(root, { recursive: true });
  assert.equal(fs.existsSync(root), false);
});
