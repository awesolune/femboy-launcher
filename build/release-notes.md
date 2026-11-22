- ⚙️ **Новая основа** — Electron обновлён с 33 до 45.3.4. Сборка остаётся без цифровой подписи
- 🗂️ **Удаление файлов в Windows** — добавлен совместимый механизм удаления папок: ссылки-junction удаляются без обхода целевой папки, корректно обрабатываются файлы «только чтение» и ошибки доступа
- ⌨️ **Модальные окна** — фокус переходит внутрь окна, Tab и Shift+Tab остаются в нём, после закрытия фокус возвращается. Скрытые и отключённые элементы пропускаются, прежнее состояние фона сохраняется
- 🖼️ **Копирование итогов игры** — копирование картинки переведено на новый API Electron. Исправлен адрес резервного репозитория GitHub
- ℹ️ **Границы проверки выпуска** — автоматические проверки и проверки интерфейса пройдены. Установка готовых EXE и обновление с 0.11.0 в отдельной Windows-среде в этом выпуске не проверялись
- ☁️ **Облако** — проверка с настоящим облачным клиентом на двух физических ПК остаётся незавершённой. Перед использованием нового формата сохрани отдельную копию важных миров

---

- ⚙️ **Updated runtime** — Electron has been upgraded from 33 to 45.3.4. The build remains unsigned
- 🗂️ **File removal on Windows** — a compatible directory-removal implementation removes junction links without traversing their targets, handles read-only files and preserves access errors
- ⌨️ **Modal dialogs** — focus moves into dialogs, Tab and Shift+Tab stay inside, and focus returns on close. Hidden and disabled controls are skipped and the background’s previous state is preserved
- 🖼️ **Copying game recaps** — image copying uses the new Electron API. The GitHub backup repository address has been corrected
- ℹ️ **Release validation limits** — automated and interface checks passed. Installing the packaged EXEs and upgrading from 0.11.0 in a separate Windows environment were not tested for this release
- ☁️ **Cloud sync** — testing with a real cloud client on two physical PCs is still incomplete. Keep a separate backup of important worlds before using the new format
