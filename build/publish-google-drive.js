'use strict';
// Copies verified release bytes to Drive for desktop. Local completion is not
// proof of cloud availability; the Google client finishes synchronization.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const FOLDER = '1Yqn1XF3UwwAPpA8mYy9-O9lKDVOGXJNX';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function stage(root, out, destination) {
  const marker = JSON.parse(fs.readFileSync(path.join(destination, 'FL-RESERVE.json'), 'utf8').replace(/^\uFEFF/, ''));
  if (marker.schema !== 1 || marker.folderId !== FOLDER) throw new Error('Wrong Google Drive reserve folder');
  const dir = path.resolve(root, out);
  const record = JSON.parse(fs.readFileSync(path.join(dir, 'source-revision.json'), 'utf8'));
  const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version) || record.version !== version || !/^[a-f0-9]{40}$/.test(record.commit)) throw new Error('Invalid release record');
  const target = path.join(destination, version);
  if (fs.existsSync(target) && (!fs.lstatSync(target).isDirectory() || fs.lstatSync(target).isSymbolicLink())) throw new Error('Unsafe version folder');
  const files = ['Setup', 'Portable'].map(kind => {
    const name = `FemboyLauncher-${kind}-${version}.exe`, source = path.join(dir, name), dest = path.join(target, name);
    const sha256 = record.files?.[name];
    if (!/^[a-f0-9]{64}$/.test(sha256 || '') || !fs.lstatSync(source).isFile() || hash(source) !== sha256) throw new Error('Release bytes changed: ' + name);
    if (fs.existsSync(dest) && (!fs.lstatSync(dest).isFile() || fs.lstatSync(dest).isSymbolicLink() || hash(dest) !== sha256)) throw new Error('Existing reserve differs: ' + name);
    return { name, source, dest, sha256 };
  });
  const sums = [...files].sort((a, b) => a.name.localeCompare(b.name)).map(f => `${f.sha256}  ${f.name}`).join('\n') + '\n';
  const sumsPath = path.join(target, 'SHA256SUMS.txt');
  if (fs.existsSync(sumsPath) && fs.readFileSync(sumsPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim() !== sums.trim()) throw new Error('Existing checksums differ');
  fs.mkdirSync(target, { recursive: true });
  for (const file of files) {
    if (!fs.existsSync(file.dest)) {
      try { fs.copyFileSync(file.source, file.dest, fs.constants.COPYFILE_EXCL); }
      catch (e) { throw new Error('Drive copy failed: ' + file.name, { cause: e }); }
    }
    if (hash(file.dest) !== file.sha256) throw new Error('Drive copy checksum mismatch: ' + file.name);
  }
  if (!fs.existsSync(sumsPath)) fs.writeFileSync(sumsPath, sums, { flag: 'wx' });
  return { version, sourceCommit: record.commit, localCopyVerified: true, cloudSyncConfirmed: false, files: files.map(({ name, sha256 }) => ({ name, sha256 })) };
}
if (require.main === module) {
  try {
    const root = path.resolve(__dirname, '..');
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'google-drive.local.json'), 'utf8').replace(/^\uFEFF/, ''));
    const result = stage(root, process.argv[2] || 'dist-release', config.directory);
    fs.writeFileSync(path.join(__dirname, 'google-drive-last.local.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(`Google Drive ${result.version}: local copies verified; cloud synchronization is handled by Drive for desktop.`);
  } catch (e) {
    console.error(e.code === 'ENOENT' ? 'Google Drive reserve is not configured or mounted; configure build/google-drive.local.json and sign in to Drive for desktop.' : e.message);
    process.exitCode = 1;
  }
}
module.exports = { stage, FOLDER };

