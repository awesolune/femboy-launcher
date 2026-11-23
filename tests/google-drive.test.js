const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { stage, FOLDER } = require('../build/publish-google-drive');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fl-google-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dest = path.join(root, 'drive'), out = path.join(root, 'out');
  fs.mkdirSync(dest); fs.mkdirSync(out);
  fs.writeFileSync(path.join(dest, 'FL-RESERVE.json'), JSON.stringify({ schema: 1, folderId: FOLDER }));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version: '1.2.3' }));
  const files = {};
  for (const kind of ['Setup', 'Portable']) {
    const name = `FemboyLauncher-${kind}-1.2.3.exe`, body = Buffer.from(kind);
    fs.writeFileSync(path.join(out, name), body);
    files[name] = crypto.createHash('sha256').update(body).digest('hex');
  }
  fs.writeFileSync(path.join(out, 'source-revision.json'), JSON.stringify({ version: '1.2.3', commit: 'a'.repeat(40), files }));
  return { root, dest, out };
}
test('stages the exact release and retries without changing existing bytes', t => {
  const f = fixture(t);
  const r = stage(f.root, 'out', f.dest);
  assert.equal(r.localCopyVerified, true);
  assert.equal(r.cloudSyncConfirmed, false);
  assert.equal(stage(f.root, 'out', f.dest).files.length, 2);
  for (const file of r.files) assert.deepEqual(fs.readFileSync(path.join(f.dest, '1.2.3', file.name)), fs.readFileSync(path.join(f.out, file.name)));
});
test('rejects changed source bytes before creating a version folder', t => {
  const f = fixture(t);
  fs.appendFileSync(path.join(f.out, 'FemboyLauncher-Setup-1.2.3.exe'), 'changed');
  assert.throws(() => stage(f.root, 'out', f.dest), /Release bytes changed/);
  assert.equal(fs.existsSync(path.join(f.dest, '1.2.3')), false);
});
test('refuses an unrelated destination and never overwrites a different release', t => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.dest, 'FL-RESERVE.json'), '{}');
  assert.throws(() => stage(f.root, 'out', f.dest), /Wrong Google/);
  fs.writeFileSync(path.join(f.dest, 'FL-RESERVE.json'), JSON.stringify({ schema: 1, folderId: FOLDER }));
  stage(f.root, 'out', f.dest);
  const file = path.join(f.dest, '1.2.3', 'FemboyLauncher-Setup-1.2.3.exe');
  fs.writeFileSync(file, 'different');
  assert.throws(() => stage(f.root, 'out', f.dest), /Existing reserve differs/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'different');
});
