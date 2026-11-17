# Архітектура сервісу `library-service`

## Призначення
HTTP-сервіс (Express 5) для обліку видачі та повернення книг бібліотеки коледжу, нарахування штрафів за прострочення та надсилання поштових сповіщень читачам.

## Каталоги та ролі
- `src/app.js`, `src/server.js` — збирання Express-застосунку (`createApp`) і запуск HTTP-сервера.
- `src/middleware/` — проміжні обробники логування (`requestLog.js`), автентифікації за `X-Token` та авторизації ролей (`auth.js`).
- `src/routes/` — HTTP-маршрути (`loans.js`), розбір параметрів запиту й формування статусів відповіді.
- `src/services/` — бізнес-логіка видачі та повернення книг (`loanService.js`).
- `src/fines/` — стратегії правил розрахунку штрафів за типом читача (`rules.js`, `index.js`).
- `src/repositories/` — сховище даних у пам'яті (`memoryRepository.js`, `seed.json`) і фабрика (`index.js`).
- `src/notifications/` — шина подій (`events.js`), підписник пошти (`emailNotifier.js`) та адаптер поштового клієнта (`mailAdapter.js`).
- `src/utils/` — обчислення календарних діб у UTC (`dates.js`) і текстові підписи ролей (`labels.js`).
- `vendor/` — зовнішній поштовий клієнт (`mail-client.js`), заборонений для змін.

## Ланцюжок обробки запиту `POST /api/loans/:id/return`
1. `src/app.js:14–17` — запит проходить `express.json()`, `requestLog`, `authenticate` (перевіряє `X-Token`, інакше `401`).
2. `src/routes/loans.js:17–20` — `requireRole("librarian")` (інакше `403`), виклик `service.returnLoan(id, date)`.
3. `src/services/loanService.js:28–38` — пошук видачі (`404`), перевірка повторного повернення (`409`), читання читача через `repo.findReader`, розрахунок днів прострочення (`daysBetween`), обчислення штрафу (`fineFor`), збереження (`repo.saveLoan`) і публікація події `events.emit("loan:returned", ...)`.
4. `src/notifications/emailNotifier.js:9–11` — при `fine > 0` викликає `notify(...)` -> `MailClient.deliver(...)` (`vendor/mail-client.js`).

## Використані патерни проєктування
- **Strategy** (`src/fines/rules.js:2-6`, `src/fines/index.js:3-7`) — таблиця функцій штрафу за типом читача.
- **Observer / Pub-Sub** (`src/notifications/events.js:1-4`, `emailNotifier.js:5-11`, `loanService.js:24,36`) — реакція на події `loan:issued` та `loan:returned` без зв'язування із сервісом.
- **Adapter** (`src/notifications/mailAdapter.js:1-10`) — узгодження моделі `reader` з `MailClient.deliver` (`vendor/mail-client.js`).
- **Chain of Responsibility** (`src/app.js:14-21`, `src/middleware/*`) — послідовна перевірка й обробка запитів та помилок.
- **Repository** (`src/repositories/memoryRepository.js:1-25`) — ізоляція збереження `readers` і `loans`.
- **Factory / Singleton** (`createApp`, `createRepository`, `createLoanService`, синглтон `events` і `client`). *(Примітка: `switch` у `src/utils/labels.js:2-13` патерном Стратегія не є).*
