# Запит із п’яти блоків: `cancelRegistration` (Частина 2, Спосіб Б)

## 1. Роль
Ти — досвідчений розробник на JavaScript (Node.js, CommonJS), який розширює наявний модуль без регресії вже працюючого функціоналу.

## 2. Контекст (обов’язковий)
- Типи даних сховища: `#src/store.js` (`EventRegistry`, `Participant`).
- Поточний модуль реєстрації: `#src/registration.js` (функція `registerParticipant` уже реалізована й проходить тести).
- Правила замовника щодо скасування: `#docs/customer-answers.md` (пункти 3–4, 10–12).

## 3. Завдання (обов’язкове)
Додай у файл `src/registration.js` функцію `cancelRegistration(registry, email)` та додай її до `module.exports`:
1. Нормалізуй `email` (`trim().toLowerCase()`).
2. Знайди учасника в `registry.registered` або `registry.waitlist`. Якщо його немає в жодному зі списків — викинь `Error` із дослівним текстом `"Учасника не знайдено"`.
3. Якщо учасника видалено з `registry.registered`, у листі очікування `registry.waitlist` є хоча б один учасник і кількість у `registered` менша за `capacity` — переведи першого учасника з `waitlist` (`shift()`) у кінець `registered` (`push()`) та поверни `{ promoted }`.
4. Якщо черга порожня або учасника видалено з `waitlist` — поверни `{ promoted: null }`.

## 4. Обмеження
- Не змінюй поведінку й сигнатуру наявної функції `registerParticipant`.
- Не змінюй `src/store.js` і `test/`.
- Без сторонніх бібліотек; спільну логіку нормалізації та пошуку пошти винеси у внутрішні допоміжні функції.

## 5. Формат
Надай лише оновлення для `src/registration.js` з JSDoc українською мовою та перелік змін.
