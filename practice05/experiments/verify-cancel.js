/**
 * Експеримент перевірки пояснень для cancelRegistration (Завдання 2).
 * Перевіряє припущення про нормалізацію пошти, переведення з черги й помилку.
 */
const assert = require("node:assert/strict");
const { createEventRegistry } = require("../src/store");
const { registerParticipant, cancelRegistration } = require("../src/registration");

const event = {
  id: "exp-2",
  title: "Експеримент",
  capacity: 1,
  registrationClosesAt: "2026-10-20T18:00:00Z",
};
const now = new Date("2026-10-10T12:00:00Z");

const r = createEventRegistry(event);
registerParticipant(r, { email: "first@kpefk.ua", fullName: "Перший" }, now);
registerParticipant(r, { email: "second@kpefk.ua", fullName: "Другий" }, now);

// 1) Нормалізація пошти в cancelRegistration (регістр і пробіли ігноруються)
const res1 = cancelRegistration(r, "  FIRST@KPEFK.UA ");
assert.equal(res1.promoted.email, "second@kpefk.ua");

// 2) Скасування за порожньої черги дає { promoted: null }
const res2 = cancelRegistration(r, "second@kpefk.ua");
assert.deepEqual(res2, { promoted: null });

// 3) Відсутня пошта дає Error("Учасника не знайдено")
assert.throws(() => cancelRegistration(r, "ghost@kpefk.ua"), {
  message: "Учасника не знайдено",
});

console.log("Усі 3 припущення щодо cancelRegistration експериментально підтвердилися.");
