const request = require("supertest");
const crypto = require("node:crypto");
const { createApp } = require("../src/app");
const { createDb } = require("../src/db");
const config = require("../src/config");
const { hashPassword } = require("../src/auth");
const { averageGrade } = require("../src/students");
const edgeData = require("../fixtures/edge-cases.json");

let db;
let app;

beforeEach(() => {
  db = createDb(edgeData);
  app = createApp(db);
});

describe("Безпека та вимоги API (tests/security.test.js)", () => {
  test("пагінація GET /api/students?page=1 повертає 5 студентів, page=2 — решту, некоректний page — 400", async () => {
    const p1 = await request(app).get("/api/students").query({ page: 1 });
    expect(p1.status).toBe(200);
    expect(p1.body).toHaveLength(5);

    const p2 = await request(app).get("/api/students").query({ page: 2 });
    expect(p2.status).toBe(200);
    expect(p2.body).toHaveLength(2);

    const badPage = await request(app).get("/api/students").query({ page: -1 });
    expect(badPage.status).toBe(400);
  });

  test("SQL-ін’єкція в пошуку не повертає чужі записи, а апостроф і % обробляються як текст", async () => {
    const sqli = await request(app).get("/api/students/search").query({ name: "%' OR 1=1 --" });
    expect(sqli.status).toBe(200);
    expect(sqli.body).toEqual([]);

    const apostrophe = await request(app).get("/api/students/search").query({ name: "О'Коннор" });
    expect(apostrophe.status).toBe(200);
    expect(apostrophe.body.map((s) => s.id)).toEqual([4]);

    const percent = await request(app).get("/api/students/search").query({ name: "100%" });
    expect(percent.status).toBe(200);
    expect(percent.body.map((s) => s.id)).toEqual([7]);
  });

  test("HTML-картка екранує тег <script> (захист від XSS) і показує «оцінок немає» без NaN", async () => {
    const xssCard = await request(app).get("/api/students/5/card");
    expect(xssCard.status).toBe(200);
    expect(xssCard.text).not.toContain("<script>");
    expect(xssCard.text).toContain("&lt;script&gt;");

    const noGradesCard = await request(app).get("/api/students/6/card");
    expect(noGradesCard.status).toBe(200);
    expect(noGradesCard.text).toContain("оцінок немає");
    expect(noGradesCard.text).not.toContain("NaN");
  });

  test("averageGrade повертає null (а не NaN) для студента без жодної оцінки", async () => {
    expect(averageGrade(db, 6)).toBeNull();
    const res = await request(app).get("/api/students/6/average");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ average: null });
  });

  test("DELETE /api/students/:id: 401 без токена, 403 для ролі student, 204 для ролі teacher", async () => {
    const noAuth = await request(app).delete("/api/students/1");
    expect(noAuth.status).toBe(401);

    const studLogin = await request(app).post("/api/login").send({ login: "student", password: "student-pass" });
    const forbidden = await request(app)
      .delete("/api/students/1")
      .set("Authorization", `Bearer ${studLogin.body.token}`);
    expect(forbidden.status).toBe(403);

    const teachLogin = await request(app).post("/api/login").send({ login: "teacher", password: "teacher-pass" });
    const ok = await request(app)
      .delete("/api/students/1")
      .set("Authorization", `Bearer ${teachLogin.body.token}`);
    expect(ok.status).toBe(204);
  });

  test("паролі гешуються стійким алгоритмом із випадковою сіллю, а не MD5", () => {
    const h1 = hashPassword("teacher-pass");
    const h2 = hashPassword("teacher-pass");
    const md5 = crypto.createHash("md5").update("teacher-pass").digest("hex");
    expect(h1).not.toBe(md5);
    expect(h1).not.toBe(h2);
  });

  test("TOKEN_SECRET береться зі змінної середовища, а не зашитий у коді", () => {
    expect(config.TOKEN_SECRET).toBe(process.env.TOKEN_SECRET);
    expect(config.TOKEN_SECRET).not.toBe("journal-secret-2026");
  });

  test("некоректне тіло POST /api/login не дає 500, а внутрішня помилка не розкриває стек", async () => {
    const emptyBody = await request(app).post("/api/login");
    expect(emptyBody.status).toBe(401);

    const badJson = await request(app)
      .post("/api/login")
      .set("Content-Type", "application/json")
      .send("{broken-json");
    expect(badJson.status).toBe(400);
    expect(badJson.body.stack).toBeUndefined();

    // Симулюємо внутрішній збій бази даних (500)
    db.close();
    const serverErr = await request(app).get("/api/students/1/average");
    expect(serverErr.status).toBe(500);
    expect(serverErr.body.stack).toBeUndefined();
    expect(JSON.stringify(serverErr.body)).not.toContain("SQLite");
  });
});
