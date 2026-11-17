# Звіт верифікації AI-зміни (`review/ai-feature`)

## 1. Перша перевірка (до виправлень)

- `npm test`: **2 failed, 4 passed, 6 total** — спростовує заяву асистента у `review/PR.md` про «Код протестовано, усе працює». Оцінка `5` повертає `400` через заміну `< 1 / > 5` на `<= 1 / >= 5`.
- `npm audit`: **44 vulnerabilities (7 moderate, 35 high, 2 critical)**; `npm audit --omit=dev`: **6 vulnerabilities (3 moderate, 1 high, 2 critical)** через пакет `request` (`form-data`, `qs`, `tough-cookie`, `uuid`).
- `npm view request`: `deprecated` («request has been deprecated»), ліцензія `Apache-2.0`.
- `node -e`: `typeof crypto.randomString === "undefined"` (галюцинація API Node.js).

## 2. Зведений перелік виявлених проблем (перед виправленням)

| № | Проблема | Категорія OWASP / чек-лист | Дія / статус |
| --- | --- | --- | --- |
| 1 | `crypto.randomString(32)` не існує в Node.js (`src/admin.js:15`) | Чек-лист п. 2, A04 | Виправити на `crypto.randomBytes(32).toString("hex")` |
| 2 | Зашитий пароль `"admin123"` та `==` (`src/admin.js:4, 14`) | Чек-лист п. 4, 7, A02, A07 | Читати `process.env.ADMIN_PASSWORD`, строге порівняння за сталий час |
| 3 | `GET /api/admin/export.csv` без перевірки токена (`src/admin.js:22`) | Чек-лист п. 4, A01 | Вимагати `Authorization: Bearer <token>`, інакше `401` |
| 4 | Неекранований CSV (`join(",")`) і формульна ін’єкція (`=`, `+`, `-`, `@`) + фрагмент із поміткою `GPL-3.0` (`src/admin.js:7-10, 23`) | Чек-лист п. 3, A05, Ліцензія (MIT vs GPL-3.0) | Повністю переписати власну RFC 4180 функцію з префіксуванням формул і форматом дати ISO |
| 5 | Залежність `request ^2.88.2` (`deprecated`, 2 critical CVE) (`package.json:19`, `src/admin.js:2, 31`) | Чек-лист п. 5, A03 | Видалити `request` (`npm uninstall`), переписати на вбудований `fetch` |
| 6 | Асинхронний `notifyLowRating` не ловить мережеву помилку в `try/catch` (`src/admin.js:28-33`) | Чек-лист п. 3, A10 | Використати `await fetch(...)` із `try/catch`, не блокувати `POST /api/feedback` |
| 7 | Регресія `validate`: `rating <= 1 || rating >= 5` відкидає `1` і `5` (`src/app.js:8`) | Чек-лист п. 3, 6 | Повернути умову `rating < 1 || rating > 5` |
| 8 | Порушення анонімності: збереження й логування `ip: req.ip` (`src/app.js:24-25`) | Конфіденційність (`REQUIREMENTS.md`) | Прибрати `ip` і `console.log(feedback)` |
| 9 | Знято `await` перед `store.add(feedback)` (`src/app.js:25`) | Чек-лист п. 3, A10 | Повернути `await store.add(...)` |
| 10 | Витік `err.message` і `err.stack` у відповіді `500` (`src/app.js:39`) | A02, A09, A10 | Логувати `console.error(err)`, повертати лише узагальнене `"Внутрішня помилка сервера"` |

## 3. Попереднє рішення

**Злити після виправлень** (після написання тестів на кожну проблему, усунення всіх 10 дефектів, видалення `request` і підтвердження `npm test` / `npm audit`).
