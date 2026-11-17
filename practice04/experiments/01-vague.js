/**
 * Експеримент 1 (Завдання 1): типова генерація у відповідь на нечіткий запит без контексту:
 * «Напиши функцію, щоб студенти могли реєструватися на події коледжу.
 *  Місць зазвичай небагато. Зроби, щоб усе працювало нормально.»
 *
 * Файл НЕ підключається до тестів і демонструє приховані рішення моделі.
 */

const events = {
  "hack-2026": { capacity: 2, participants: [] },
};

function registerStudent(eventId, name, email) {
  const ev = events[eventId];
  if (!ev) {
    return { success: false, message: "Подію не знайдено" };
  }
  if (ev.participants.length >= ev.capacity) {
    return { success: false, message: "Вільних місць більше немає" };
  }
  if (ev.participants.some((p) => p.email === email)) {
    return { success: false, message: "Студент уже зареєстрований" };
  }
  ev.participants.push({ name, email });
  return { success: true, message: "Реєстрація успішна" };
}

module.exports = { registerStudent };
