// Совместимость с Electron 45 на Windows (Node 24 внутри Electron), проверено 19.11.2026 на 45.3.4.
// Родной рекурсивный fs.rmSync там:
//  1) ЗАХОДИТ ВНУТРЬ junction и удаляет файлы папки, на которую ссылка указывает (обычный Node 24 и Electron 33 удаляют
//     только саму ссылку) — риск потерять чужие данные при удалении сборки, корзины, временных папок;
//  2) не удаляет файлы с атрибутом «только чтение» (EPERM) — распакованная Java, .git модпаков, копии с флешки.
// fs.promises.rm и fs.rm этим не страдают. Мест с fs.rmSync в лаунчере 80+, поэтому один раз при запуске подменяем
// рекурсивный fs.rmSync на Windows обходом как в Node 20: ссылка удаляется как ссылка, внутрь не заходим.
// Без recursive и на других системах — родная функция без изменений. Тест: tests/rmsync-compat.test.js.
const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const RETRY = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'ENOTEMPTY', 'EPERM']);
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function makeWritable(p, mode) {
  if (!(mode & 0o200)) fs.chmodSync(p, mode | 0o666);
}

function removeEntry(p) {
  let st;
  try {
    st = fs.lstatSync(p);
  } catch (e) {
    if (e.code === 'ENOENT') return;
    throw e;
  }
  if (st.isSymbolicLink()) {
    // junction и ссылка на папку удаляются как папка-пустышка, ссылка на файл — как файл; цель не трогаем
    try {
      return fs.unlinkSync(p);
    } catch (e) {
      if (!['EPERM', 'EISDIR', 'EACCES'].includes(e.code)) throw e;
      return fs.rmdirSync(p);
    }
  }
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(p)) removeEntry(path.join(p, name));
    try {
      return fs.rmdirSync(p);
    } catch (e) {
      if (e.code !== 'EPERM' && e.code !== 'EACCES') throw e;
      makeWritable(p, st.mode);
      return fs.rmdirSync(p);
    }
  }
  try {
    fs.unlinkSync(p);
  } catch (e) {
    if (e.code !== 'EPERM' && e.code !== 'EACCES') throw e;
    makeWritable(p, st.mode);
    fs.unlinkSync(p);
  }
}

function rmTreeSync(target, options = {}) {
  if (typeof target !== 'string' && !Buffer.isBuffer(target) && !(target instanceof URL)) {
    const e = new TypeError('Path must be a string, Buffer or file URL');
    e.code = 'ERR_INVALID_ARG_TYPE';
    throw e;
  }
  const p = path.resolve(target instanceof URL ? fileURLToPath(target) : String(target));
  const tries = Math.max(0, Number(options.maxRetries) || 0);
  const delay = Math.max(0, Number(options.retryDelay) || 100);
  for (let i = 0; ; i++) {
    try {
      // existsSync swallows EACCES; force may suppress ENOENT only.
      try { fs.lstatSync(p); }
      catch (e) { if (e.code === 'ENOENT' && options.force) return; throw e; }
      return removeEntry(p);
    } catch (e) {
      if (i >= tries || !RETRY.has(e.code)) throw e;
      sleep(delay * (i + 1));
    }
  }
}

function install() {
  if (process.platform !== 'win32' || fs.rmSync.__flCompat) return;
  const original = fs.rmSync;
  const patched = function rmSync(target, options) {
    if (!options?.recursive) return original.call(fs, target, options);
    return rmTreeSync(target, options);
  };
  patched.__flCompat = true;
  fs.rmSync = patched;
}

install();
module.exports = { install, rmTreeSync };
