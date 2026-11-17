/**
 * Модуль обчислення перетинів та вільних часових проміжків аудиторії.
 * @module slots
 */

const { toMinutes, formatTime } = require("./time");

/**
 * Проміжок часу у хвилинах від початку доби.
 * @typedef {object} TimeSpan
 * @property {number} start Початок проміжку у хвилинах від 00:00.
 * @property {number} end Кінець проміжку у хвилинах від 00:00.
 */

/**
 * Вільний слот або зайнятий часовий інтервал у форматі "ГГ:ХХ".
 * @typedef {object} TimeSlot
 * @property {string} from Час початку проміжку у форматі "ГГ:ХХ".
 * @property {string} to Час завершення проміжку у форматі "ГГ:ХХ".
 */

/**
 * Перевіряє, чи перетинаються два напіввідкриті часові інтервали [start, end).
 * Суміжні інтервали, що лише дотикаються межею (наприклад, 10:00–11:20 та 11:20–12:40),
 * перетином не вважаються.
 *
 * @param {TimeSpan} a Перший проміжок у хвилинах від початку доби.
 * @param {TimeSpan} b Другий проміжок у хвилинах від початку доби.
 * @returns {boolean} true, якщо інтервали мають спільний непорожній час.
 * @example
 * overlaps({ start: 600, end: 680 }, { start: 680, end: 760 }); // false
 */
function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

/**
 * Знаходить усі вільні проміжки аудиторії в межах робочого дня, тривалістю не менше minLength хвилин.
 *
 * Ідея алгоритму: шукаємо доповнення до об'єднання зайнятих інтервалів на відрізку [opens, closes].
 * Злиття зайнятих проміжків потрібне через перетини та вкладення: наприклад, якщо наявні
 * бронювання 09:00–12:00 і 09:30–10:00 (або частковий перетин 09:00–10:15 і 10:00–11:30),
 * без попереднього злиття прохід по сирих інтервалах міг би сформувати хибне вільне вікно
 * 10:00–12:00 всередині вже зайнятої години.
 * Інваріант: після кроку злиття інтервали в merged впорядковані за зростанням і попарно не
 * дотикаються (last.end < cur.start), а cursor монотонно не спадає.
 * Складність: O(n log n) за часом через сортування (n — кількість бронювань), O(n) за пам'яттю.
 *
 * @param {Array<TimeSlot>} bookings Перелік бронювань на день із полями from та to ("ГГ:ХХ").
 * @param {string} opens Час відкриття аудиторії у форматі "ГГ:ХХ".
 * @param {string} closes Час закриття аудиторії у форматі "ГГ:ХХ".
 * @param {number} minLength Мінімальна тривалість шуканого вільного проміжку у хвилинах.
 * @returns {Array<TimeSlot>} Упорядкований перелік вільних інтервалів у форматі "ГГ:ХХ".
 * @example
 * findFreeSlots([{ from: "09:00", to: "12:00" }, { from: "09:30", to: "10:00" }], "08:00", "14:00", 45);
 * // [{ from: "08:00", to: "09:00" }, { from: "12:00", to: "14:00" }]
 */
function findFreeSlots(bookings, opens, closes, minLength) {
  // 1. Переводимо час у хвилини й сортуємо зайняті інтервали за початком для однопрохідного злиття.
  const busy = bookings
    .map((b) => ({ start: toMinutes(b.from), end: toMinutes(b.to) }))
    .sort((a, b) => a.start - b.start);

  // 2. Зливаємо перетинні та суміжні інтервали, щоб гарантувати монотонність зайнятих меж.
  const merged = [];
  for (const cur of busy) {
    const last = merged[merged.length - 1];
    if (last && cur.start <= last.end) last.end = Math.max(last.end, cur.end);
    else merged.push({ ...cur });
  }

  // 3. Скануємо проміжки між об'єднаними зайнятими блоками від відкриття до закриття аудиторії.
  const free = [];
  let cursor = toMinutes(opens);
  for (const b of merged) {
    if (b.start - cursor >= minLength) free.push({ from: formatTime(cursor), to: formatTime(b.start) });
    cursor = Math.max(cursor, b.end);
  }
  const end = toMinutes(closes);
  if (end - cursor >= minLength) free.push({ from: formatTime(cursor), to: formatTime(end) });
  return free;
}

module.exports = { overlaps, findFreeSlots };
