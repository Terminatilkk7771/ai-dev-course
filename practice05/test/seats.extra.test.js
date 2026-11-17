const test = require("node:test");
const assert = require("node:assert/strict");
const { createEventRegistry } = require("../src/store");
const { availableSeats } = require("../src/seats");
const { registerParticipant, cancelRegistration } = require("../src/registration");

const now = new Date("2026-10-10T12:00:00Z");
const makeEvent = (capacity) => ({
  id: "extra-2026",
  title: "Додатковий тест події",
  capacity,
  registrationClosesAt: "2026-10-20T18:00:00Z",
});

test("availableSeats: додавання у waitlist не зменшує доступні місця нижче 0", () => {
  const r = createEventRegistry(makeEvent(1));
  registerParticipant(r, { email: "one@kpefk.ua", fullName: "Один" }, now);
  registerParticipant(r, { email: "two@kpefk.ua", fullName: "Два" }, now);
  registerParticipant(r, { email: "three@kpefk.ua", fullName: "Три" }, now);
  assert.equal(availableSeats(r), 0);
});

test("availableSeats: скасування за порожньої черги звільняє 1 місце", () => {
  const r = createEventRegistry(makeEvent(2));
  registerParticipant(r, { email: "one@kpefk.ua", fullName: "Один" }, now);
  registerParticipant(r, { email: "two@kpefk.ua", fullName: "Два" }, now);
  assert.equal(availableSeats(r), 0);
  cancelRegistration(r, "one@kpefk.ua");
  assert.equal(availableSeats(r), 1);
});

test("availableSeats: послідовні реєстрації зменшують кількість вільних місць до нуля", () => {
  const r = createEventRegistry(makeEvent(3));
  assert.equal(availableSeats(r), 3);
  registerParticipant(r, { email: "a@kpefk.ua", fullName: "А" }, now);
  assert.equal(availableSeats(r), 2);
  registerParticipant(r, { email: "b@kpefk.ua", fullName: "Б" }, now);
  assert.equal(availableSeats(r), 1);
  registerParticipant(r, { email: "c@kpefk.ua", fullName: "В" }, now);
  assert.equal(availableSeats(r), 0);
});

test("availableSeats: якщо кількість зареєстрованих перевищує capacity, повертає 0", () => {
  const r = createEventRegistry(makeEvent(1));
  r.registered.push(
    { email: "a@kpefk.ua", fullName: "А" },
    { email: "b@kpefk.ua", fullName: "Б" }
  );
  assert.equal(availableSeats(r), 0);
});
