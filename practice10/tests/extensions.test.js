const request = require("supertest");
const { createApp } = require("../src/app");
const { fineFor } = require("../src/fines");
const { readerTypeLabel } = require("../src/utils/labels");
const { getJournal, clearJournal } = require("../src/notifications/fineJournal");

const LIB = { "X-Token": "t-librarian" };

describe("Завдання 6: тип читача guest і розширення стратегії штрафів", () => {
  test("штраф для guest за 3 дні — 30 грн, за 40 днів — 200 грн (ліміт)", () => {
    expect(fineFor("guest", 3)).toBe(30);
    expect(fineFor("guest", 40)).toBe(200);
    expect(fineFor("guest", 0)).toBe(0);
  });

  test("підпис типу guest в інтерфейсі — «Гість»", () => {
    expect(readerTypeLabel("guest")).toBe("Гість");
  });

  test("повернення книги гостем через API нараховує штраф за правилом guest", async () => {
    const app = createApp();
    const issued = await request(app)
      .post("/api/loans")
      .set(LIB)
      .send({ readerId: 4, bookId: 25, date: "2026-09-01" });
    expect(issued.status).toBe(201);

    const returned = await request(app)
      .post(`/api/loans/${issued.body.id}/return`)
      .set(LIB)
      .send({ date: "2026-09-18" }); // строк 2026-09-15 -> 3 дні прострочення

    expect(returned.status).toBe(200);
    expect(returned.body.overdueDays).toBe(3);
    expect(returned.body.fine).toBe(30);
  });
});

describe("Завдання 7: журнал нарахованих штрафів (fineJournal)", () => {
  beforeEach(() => {
    clearJournal();
  });

  test("повернення книги зі штрафом додає запис до журналу штрафів", async () => {
    const app = createApp();
    const issued = await request(app)
      .post("/api/loans")
      .set(LIB)
      .send({ readerId: 1, bookId: 12, date: "2026-09-01" });

    await request(app)
      .post(`/api/loans/${issued.body.id}/return`)
      .set(LIB)
      .send({ date: "2026-09-18" });

    expect(getJournal()).toEqual([
      {
        loanId: issued.body.id,
        readerId: 1,
        reader: "Коваль Андрій",
        overdueDays: 3,
        fine: 15,
      },
    ]);
  });

  test("повернення книги вчасно не створює запису в журналі штрафів", async () => {
    const app = createApp();
    const issued = await request(app)
      .post("/api/loans")
      .set(LIB)
      .send({ readerId: 1, bookId: 13, date: "2026-09-01" });

    await request(app)
      .post(`/api/loans/${issued.body.id}/return`)
      .set(LIB)
      .send({ date: "2026-09-15" });

    expect(getJournal()).toEqual([]);
  });
});

describe("Завдання 8: додаткові межові перевірки GET /api/readers/:id/fines", () => {
  test("некоректний id (нечисловий, 0, від'ємний) повертає 400", async () => {
    const app = createApp();
    expect((await request(app).get("/api/readers/abc/fines").set(LIB)).status).toBe(400);
    expect((await request(app).get("/api/readers/0/fines").set(LIB)).status).toBe(400);
    expect((await request(app).get("/api/readers/-3/fines").set(LIB)).status).toBe(400);
  });

  test("запит без токена повертає 401", async () => {
    const app = createApp();
    expect((await request(app).get("/api/readers/1/fines")).status).toBe(401);
  });

  test("неповернена книга (навіть потенційно прострочена) не входить до суми штрафів, поки не повернена", async () => {
    const app = createApp();
    await request(app)
      .post("/api/loans")
      .set(LIB)
      .send({ readerId: 1, bookId: 77, date: "2026-08-01" });

    const res = await request(app).get("/api/readers/1/fines").set(LIB);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ readerId: 1, total: 0, loans: 0 });
  });
});
