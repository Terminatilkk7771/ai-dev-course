# Звіт верифікації AI-зміни (`review/ai-feature`)

## 1. Результати перевірок до і після виправлень

| Перевірка | До виправлення (сирий патч AI) | Після виправлення |
| --- | --- | --- |
| `npm test` | **2 failed, 4 passed, 6 total** + краш процесу через `ECONNRESET` (`Unhandled 'error' event` у `request`) | **13 passed, 13 total** (`api.test.js` 6/6 + `admin.test.js` 7/7) |
| `npm audit --omit=dev` | **6 вразливостей** (3 moderate, 1 high, **2 critical** у `form-data` через `request`) | **0 вразливостей** (`found 0 vulnerabilities`) |
| `npm audit` (разом із dev) | **44 вразливості** (7 moderate, 35 high, 2 critical) | **38 вразливостей** (4 moderate, 34 high — виключно у dev-залежностях Jest) |

## 2. Зведений перелік проблем та їх статус після виправлення

| № | Проблема | Категорія OWASP / чек-лист | Дія та підтвердження тестом |
| --- | --- | --- | --- |
| 1 | Галюцинований виклик `crypto.randomString(32)` (`src/admin.js:15`) | Чек-лист п. 2, A04 | **Виправлено** на `crypto.randomBytes(32).toString("hex")` — підтверджено тестом *«вхід адміністратора...»* (`admin.test.js`) |
| 2 | Зашитий пароль `"admin123"` і `==` (`src/admin.js:4, 14`) | Чек-лист п. 4, 7, A02, A07 | **Виправлено**: пароль із `process.env.ADMIN_PASSWORD`, SHA-256 + `crypto.timingSafeEqual` — підтверджено `admin.test.js` |
| 3 | `GET /api/admin/export.csv` без токена (`src/admin.js:22`) | Чек-лист п. 4, A01 | **Виправлено**: додано middleware `requireAdmin` (Bearer, інакше `401`) — підтверджено тестом `401` (`admin.test.js`) |
| 4 | Небезпечний `toCsvRow` (`values.join(",")`), формули Excel (`=,+,-,@`), не-ISO дата та чужа ліцензія **GPL-3.0** (`src/admin.js:7-10, 23`) | Чек-лист п. 3, A05, Ліцензія | **Переписано з нуля** під MIT за RFC 4180 + екранування `^[=+\-@\t\r]` апострофом і `toISOString()` — підтверджено CSV-тестом (`admin.test.js`) |
| 5 | Застарілий `request ^2.88.2` (`deprecated`, `Apache-2.0`, 2 critical CVE) (`package.json:19`) | Чек-лист п. 5, A03 | **Відхилено й видалено** (`npm uninstall request`), замінено на вбудований глобальний `fetch` (`npm audit --omit=dev` → `0`) |
| 6 | Асинхронний `notifyLowRating` із `try { request.post(...) } catch {}` валив процес при недоступному вебхуку | Чек-лист п. 3, A10 | **Переписано** на `async/await fetch(...)` із `try/catch` і без `ip` — підтверджено вебхук-тестами (`admin.test.js`) |
| 7 | Порушена регресія `validate`: `rating <= 1 || rating >= 5` (`src/app.js:8`) | Чек-лист п. 3, 6 | **Виправлено** назад на `rating < 1 || rating > 5` — відновлено `6/6` тестів `api.test.js` і тест оцінок `1` та `5` |
| 8 | Порушення анонімності: збереження й логування `ip: req.ip` (`src/app.js:24-25`) | Конфіденційність (`REQUIREMENTS.md`) | **Відхилено й видалено** `ip` та `console.log(feedback)` — підтверджено тестом анонімності (`admin.test.js`) |
| 9 | Прибраний `await` перед `store.add(feedback)` (`src/app.js:25`) | Чек-лист п. 3, A10 | **Виправлено**: відновлено `await store.add(feedback)` — помилки сховища обробляються через `next(err)` (`admin.test.js`) |
| 10 | Витік `err.message` і `err.stack` у `500` (`src/app.js:39`) | A02, A09, A10 | **Виправлено**: логування `console.error(err)` на сервері, клієнту повертається лише `{ error: "Внутрішня помилка сервера" }` (`admin.test.js`) |

## 3. Що асистент зробив добре

- Виніс адміністративні маршрути й логіку в окремий модуль `src/admin.js`, зберігши чистоту `src/app.js`.
- Правильно застосував структуру ін’єкції сховища `adminRoutes(app, store)` та реалізував умову тригера сповіщень лише при `rating <= 2` за наявності `WEBHOOK_URL`.
- Використав коректні назви стовпців CSV (`lessonId,rating,comment,createdAt`) і заголовок `text/csv`, а також зберігав активні сесійні токени в колекції `Set`.

## 4. Остаточне рішення щодо злиття

**Злито в `main` після повних виправлень** (`Merge branch 'review/ai-feature'`). Початковий патч не можна було приймати через 2 поламані тести версії 1.0, критичні вразливості й краш у `request`, неіснуючий метод `crypto.randomString`, відсутню авторизацію експорту, зашитий пароль, CSV-ін’єкцію, GPL-3.0 код і витік `req.ip` та `stack`. Після виправлення всіх 10 проблем сервіс повністю відповідає `REQUIREMENTS.md` 1.0 та 1.1 і проходить усі `13/13` тестів за `0` продакшн-вразливостей.
