/**
 * Сервіс управління бронюваннями аудиторій у пам'яті процесу.
 * @module bookings
 */

const { toMinutes } = require("./time");
const { overlaps } = require("./slots");

/** Максимальна дозволена тривалість одного бронювання у годинах (за замовчуванням 4). */
const MAX_BOOKING_HOURS = Number(process.env.MAX_BOOKING_HOURS) || 4;
/** Мінімальний строк до початку бронювання у годинах, коли ще дозволене скасування. */
const MIN_CANCEL_HOURS = 2;

/**
 * Довідковий запис аудиторії коледжу.
 * @typedef {object} Room
 * @property {string} id Унікальний код аудиторії (наприклад, "204").
 * @property {string} name Назва аудиторії.
 * @property {number} seats Кількість посадкових місць.
 * @property {string} opens Час відкриття у форматі "ГГ:ХХ".
 * @property {string} closes Час закриття у форматі "ГГ:ХХ".
 */

/**
 * Вхідні дані для створення нового бронювання.
 * @typedef {object} BookingInput
 * @property {string} roomId Ідентифікатор аудиторії.
 * @property {string} date Дата бронювання у форматі "РРРР-ММ-ДД".
 * @property {string} from Час початку у форматі "ГГ:ХХ".
 * @property {string} to Час завершення у форматі "ГГ:ХХ".
 * @property {string} who Ім'я або підрозділ замовника бронювання.
 */

/**
 * Збережений запис бронювання з присвоєним ідентифікатором.
 * @typedef {object} Booking
 * @property {number} id Порядковий номер бронювання.
 * @property {string} roomId Ідентифікатор аудиторії.
 * @property {string} date Дата бронювання у форматі "РРРР-ММ-ДД".
 * @property {string} from Час початку у форматі "ГГ:ХХ".
 * @property {string} to Час завершення у форматі "ГГ:ХХ".
 * @property {string} who Замовник бронювання.
 */

/**
 * Створює об'єкт помилки з прив'язаним HTTP-статусом для відповіді API.
 *
 * @param {number} status HTTP-код статусу відповіді (наприклад, 400, 404, 409).
 * @param {string} message Повідомлення про помилку, безпечне для показу клієнту.
 * @returns {Error} Екземпляр Error із властивостями status та expose.
 */
function httpError(status, message) {
  return Object.assign(new Error(message), { status, expose: true });
}

/**
 * Створює сервіс бронювань із внутрішнім сховищем у пам'яті.
 *
 * @param {Array<Room>} rooms Перелік доступних аудиторій коледжу.
 * @returns {object} Інтерфейс сервісу з методами list, create, cancel та rooms.
 */
function createBookingService(rooms) {
  const bookings = [];
  let nextId = 1;

  /**
   * Знаходить аудиторію за ідентифікатором або сигналізує про її відсутність.
   *
   * @param {string} id Ідентифікатор аудиторії.
   * @returns {Room} Знайдений запис аудиторії.
   * @throws {Error} HTTP 404, якщо аудиторію не знайдено.
   */
  function findRoom(id) {
    const room = rooms.find((r) => r.id === id);
    if (!room) throw httpError(404, "Аудиторію не знайдено");
    return room;
  }

  return {
    /**
     * Повертає всі бронювання обраної аудиторії на вказану дату.
     *
     * @param {string} roomId Ідентифікатор аудиторії.
     * @param {string} date Дата у форматі "РРРР-ММ-ДД".
     * @returns {Array<Booking>} Масив бронювань аудиторії на задану дату.
     * @throws {Error} HTTP 404, якщо аудиторії не існує.
     */
    list(roomId, date) {
      findRoom(roomId);
      return bookings.filter((b) => b.roomId === roomId && b.date === date);
    },

    /**
     * Створює нове бронювання після перевірки часу, годин роботи, ліміту тривалості та конфліктів.
     *
     * @param {BookingInput} input Дані для створення бронювання.
     * @returns {Booking} Створене бронювання з новим числовим id.
     * @throws {RangeError} Якщо формат часу from або to не відповідає "ГГ:ХХ".
     * @throws {Error} HTTP 404 (аудиторії немає), 400 (некоректний проміжок або поза графіком/лімітом), 409 (перетин).
     * @example
     * service.create({ roomId: "204", date: "2026-11-02", from: "10:00", to: "11:30", who: "Тимченко С. В." });
     */
    create({ roomId, date, from, to, who }) {
      const room = findRoom(roomId);
      const span = { start: toMinutes(from), end: toMinutes(to) };
      if (span.end <= span.start) throw httpError(400, "Кінець має бути пізніше за початок");
      if (span.start < toMinutes(room.opens) || span.end > toMinutes(room.closes)) {
        throw httpError(400, "Аудиторія в цей час зачинена");
      }
      if (span.end - span.start > MAX_BOOKING_HOURS * 60) throw httpError(400, "Занадто довге бронювання");
      const clash = this.list(roomId, date).find((b) => overlaps(span, { start: toMinutes(b.from), end: toMinutes(b.to) }));
      if (clash) throw httpError(409, `Перетин із бронюванням #${clash.id}`);
      const booking = { id: nextId++, roomId, date, from, to, who };
      bookings.push(booking);
      return booking;
    },

    /**
     * Скасовує наявне бронювання не пізніше ніж за 2 години до його початку.
     *
     * @param {number} id Унікальний ідентифікатор бронювання.
     * @param {Date} [now=new Date()] Поточний момент часу для перевірки допустимості скасування.
     * @returns {void}
     * @throws {Error} HTTP 404 (бронювання не знайдено) або 409 (до початку менше MIN_CANCEL_HOURS).
     */
    cancel(id, now = new Date()) {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) throw httpError(404, "Бронювання не знайдено");
      const startsAt = new Date(`${booking.date}T${booking.from}:00`);
      if ((startsAt.getTime() - now.getTime()) / 3_600_000 < MIN_CANCEL_HOURS) throw httpError(409, "Скасувати вже неможливо");
      bookings.splice(bookings.indexOf(booking), 1);
    },

    rooms: findRoom,
  };
}

module.exports = { createBookingService, MAX_BOOKING_HOURS, MIN_CANCEL_HOURS };
