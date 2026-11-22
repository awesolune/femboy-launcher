// Те же быстрые проверки (tests/*.test.js), но на Node самого Электрона. Он старше системного Node и на Windows ведёт себя
// по-своему (например, fs.cp отдаёт фильтру пути вида «\\?\C:\…»), так что часть сбоев видна только здесь.
// Запуск: npm run test:electron-node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const electron = require('electron'); // в обычном Node это путь к electron.exe

const root = path.join(__dirname, '..');
const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.js')).map((f) => path.join('tests', f));
// Как в приложении: src/main.js первым делом подключает rmsync-compat (родной рекурсивный fs.rmSync Electron 45 на Windows
// заходит в junction и не удаляет «только чтение»), поэтому и тесты на Node Электрона идут с ней
const compat = path.join(root, 'src', 'core', 'rmsync-compat.js');
// в NODE_OPTIONS обратная косая черта — экранирование, поэтому путь с прямыми
const NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --require "${compat.split(path.sep).join('/')}"`.trim();
const r = spawnSync(electron, ['--test', '--test-timeout=120000', ...files], { cwd: root, stdio: 'inherit', env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', NODE_OPTIONS } });
process.exit(r.status ?? 1);
