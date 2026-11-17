const request = require("supertest");
const { createApp } = require("../src/app");

const booking = { roomId: "204", date: "2026-11-02", from: "10:00", to: "11:30", who: "Тимченко С. В." };

test("бронювання створюється", async () => {
  const res = await request(createApp()).post("/api/bookings").send(booking);
  expect(res.status).toBe(201);
});

test("перетин з наявним бронюванням — 409", async () => {
  const app = createApp();
  await request(app).post("/api/bookings").send(booking);
  const res = await request(app).post("/api/bookings").send({ ...booking, from: "11:00", to: "12:00" });
  expect(res.status).toBe(409);
});

test("бронювання поза годинами роботи — 400", async () => {
  const res = await request(createApp()).post("/api/bookings").send({ ...booking, from: "07:00", to: "08:00" });
  expect(res.status).toBe(400);
});

test("вільні проміжки аудиторії на дату", async () => {
  const app = createApp();
  await request(app).post("/api/bookings").send(booking);
  const res = await request(app).get("/api/rooms/204/free").query({ date: "2026-11-02", min: 60 });
  expect(res.body).toEqual([{ from: "08:30", to: "10:00" }, { from: "11:30", to: "20:00" }]);
});

test("суміжні напіввідкриті інтервали 10:00–11:20 і 11:20–12:40 дозволені та відображаються у списку", async () => {
  const app = createApp();
  const r1 = await request(app).post("/api/bookings").send({ ...booking, from: "10:00", to: "11:20" });
  const r2 = await request(app).post("/api/bookings").send({ ...booking, from: "11:20", to: "12:40" });
  expect(r1.status).toBe(201);
  expect(r2.status).toBe(201);

  const list = await request(app).get("/api/rooms/204/bookings").query({ date: "2026-11-02" });
  expect(list.status).toBe(200);
  expect(list.body).toHaveLength(2);
});

test("перелік аудиторій та 404 для неіснуючої аудиторії", async () => {
  const app = createApp();
  const rooms = await request(app).get("/api/rooms");
  expect(rooms.status).toBe(200);
  expect(rooms.body.length).toBe(3);

  const missing = await request(app).get("/api/rooms/999/bookings").query({ date: "2026-11-02" });
  expect(missing.status).toBe(404);
});

test("скасування бронювання: 204 вчасно, 409 замало часу (< 2 год) і 404 для неіснуючого id", async () => {
  const app = createApp();
  const futureRes = await request(app).post("/api/bookings").send({ ...booking, date: "2099-12-31" });
  const delOk = await request(app).delete(`/api/bookings/${futureRes.body.id}`);
  expect(delOk.status).toBe(204);

  const pastRes = await request(app).post("/api/bookings").send({ ...booking, date: "2020-01-01" });
  const delLate = await request(app).delete(`/api/bookings/${pastRes.body.id}`);
  expect(delLate.status).toBe(409);

  const delMissing = await request(app).delete("/api/bookings/999");
  expect(delMissing.status).toBe(404);
});
