# Загальний запит: «Перевір цей код» (Завдання 3)

Файли в контексті: `#src/app.js`, `#src/students.js`, `#src/auth.js`, `#src/config.js`.

## Отримані зауваження асистента (поверхневий огляд)
1. **Склеювання SQL-рядка** у `findByName` (`src/students.js:13`) — потенційна SQL-ін’єкція.
2. **Жорстко зашитий секрет** `TOKEN_SECRET` у `src/config.js:5`.
3. **Стильові / другорядні зауваження (частина — хибні або некритичні):**
   - `id` не перевіряється всередині `getById` і `deleteStudent` у `src/students.js` *(хибне спрацювання — валідацію виконує middleware `validateId` у `src/app.js`)*.
   - Змінна `page` у `listStudents` береться з `req.query.page` без валідації.
   - `GET /api/students` доступний без автентифікації *(хибне спрацювання — це відповідає таблиці вимог `README.md`)*.

## Пропущені при загальному запиті проблеми
- Не помічено помилку пагінації `PAGE_SIZE - 1` (`src/students.js:7`).
- Не помічено ділення на 0 (`NaN`) в `averageGrade` (`src/students.js:25`).
- Не помічено XSS та виведення `NaN` у маршруті `/api/students/:id/card` (`src/app.js:43`).
- Не помічено відсутність перевірки ролі `teacher` (`403`) у `DELETE /api/students/:id` (`src/app.js:46`).
- Не згадано слабке гешування паролів MD5 без солі (`src/auth.js:5`) та витік `err.stack` (`src/app.js:52`).
