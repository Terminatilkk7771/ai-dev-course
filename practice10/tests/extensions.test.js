const request = require("supertest");
const { createApp } = require("../src/app");
const { fineFor } = require("../src/fines");
const { readerTypeLabel } = require("../src/utils/labels");

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
