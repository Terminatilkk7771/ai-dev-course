/** @typedef {import("./store").EventRegistry} EventRegistry */

/**
 * Обчислює кількість вільних місць на подію (не менше 0).
 *
 * @param {EventRegistry} registry сховище реєстрацій на подію
 * @returns {number} кількість доступних місць (>= 0)
 */
function availableSeats(registry) {
  if (!registry || !registry.event || !Array.isArray(registry.registered)) {
    throw new TypeError("Некоректне сховище реєстрацій");
  }
  const capacity = Number(registry.event.capacity);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return 0;
  }
  return Math.max(0, capacity - registry.registered.length);
}

module.exports = { availableSeats };
