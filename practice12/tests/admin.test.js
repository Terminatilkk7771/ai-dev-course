const http = require("node:http");
const request = require("supertest");
const { createApp } = require("../src/app");
const { createStore } = require("../src/store");

describe("Верифікація функціоналу 1.1 та вимог безпеки/конфіденційності", () => {
  const originalPassword = process.env.ADMIN_PASSWORD;
  const originalWebhook = process.env.WEBHOOK_URL;

  beforeAll(() => {
    process.env.ADMIN_PASSWORD = "test-only-password";
  });

  afterEach(() => {
    if (originalWebhook === undefined) {
      delete process.env.WEBHOOK_URL;
    } else {
      process.env.WEBHOOK_URL = originalWebhook;
    }
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalPassword;
    }
  });

  test("вхід адміністратора приймає пароль із ADMIN_PASSWORD, відхиляє старий/невірний пароль і повертає стійкий токен", async () => {
    const app = createApp();

    const badOld = await request(app).post("/api/admin/login").send({ password: "admin123" });
    expect(badOld.status).toBe(401);

    const badEmpty = await request(app).post("/api/admin/login").send({});
    expect(badEmpty.status).toBe(401);

    const ok = await request(app).post("/api/admin/login").send({ password: "test-only-password" });
    expect(ok.status).toBe(200);
    expect(typeof ok.body.token).toBe("string");
    expect(ok.body.token).toMatch(/^[a-f0-9]{64}$/i);
  });

  test("експорт CSV без токена або з невалідним токеном заборонено (401)", async () => {
    const app = createApp();

    const noToken = await request(app).get("/api/admin/export.csv");
    expect(noToken.status).toBe(401);

    const fakeToken = await request(app)
      .get("/api/admin/export.csv")
      .set("Authorization", "Bearer fake-token");
    expect(fakeToken.status).toBe(401);
  });

  test("оцінки 1 та 5 приймаються згідно з вимогами версії 1.0", async () => {
    const app = createApp();

    const r1 = await request(app).post("/api/feedback").send({ lessonId: "L38", rating: 1, comment: "Складно" });
    const r5 = await request(app).post("/api/feedback").send({ lessonId: "L38", rating: 5, comment: "Супер" });

    expect(r1.status).toBe(201);
    expect(r5.status).toBe(201);
  });

  test("CSV коректно екранує коми, лапки, переноси рядка, захищає від формул (=,+,-,@) та містить ISO-дату", async () => {
    const app = createApp();
    const login = await request(app).post("/api/admin/login").send({ password: "test-only-password" });
    const token = login.body.token;

    await request(app).post("/api/feedback").send({
      lessonId: "L38",
      rating: 4,
      comment: 'Кома, "лапки"\nі новий рядок',
    });
    await request(app).post("/api/feedback").send({
      lessonId: "L38",
      rating: 1,
      comment: "=CMD|'/C calc'!A0",
    });
    await request(app).post("/api/feedback").send({
      lessonId: "L38",
      rating: 3,
      comment: "@SUM(A1:A2)",
    });

    const csvRes = await request(app)
      .get("/api/admin/export.csv")
      .set("Authorization", `Bearer ${token}`);

    expect(csvRes.status).toBe(200);
    expect(csvRes.headers["content-type"]).toMatch(/text\/csv/);
    expect(csvRes.text).toContain("lessonId,rating,comment,createdAt");
    expect(csvRes.text).toContain('"Кома, ""лапки""\nі новий рядок"');
    expect(csvRes.text).toContain("'=CMD|'/C calc'!A0");
    expect(csvRes.text).not.toMatch(/,=CMD/);
    expect(csvRes.text).toContain("'@SUM(A1:A2)");
    expect(csvRes.text).not.toMatch(/,@SUM/);
    expect(csvRes.text).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  test("анонімність: збережений відгук не містить IP-адреси та не логується в консоль", async () => {
    const store = createStore();
    const app = createApp({ store });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const res = await request(app)
      .post("/api/feedback")
      .set("User-Agent", "SecretBrowser/1.0")
      .send({ lessonId: "L38", rating: 4, comment: "Добре" });

    expect(res.status).toBe(201);
    const items = store.all();
    expect(items).toHaveLength(1);
    expect(items[0]).not.toHaveProperty("ip");
    expect(items[0]).not.toHaveProperty("userAgent");
    expect(Object.keys(items[0]).sort()).toEqual(["comment", "createdAt", "lessonId", "rating"]);
    expect(logSpy).not.toHaveBeenCalled();
  });

  test("помилка сховища повертає 500 без витоку err.message і стека викликів", async () => {
    const failingStore = {
      all: () => [],
      add: async () => {
        throw new Error("disk full secret path C:\\internal");
      },
    };
    const app = createApp({ store: failingStore });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).post("/api/feedback").send({ lessonId: "L38", rating: 4 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Внутрішня помилка сервера" });
    expect(res.body).not.toHaveProperty("stack");
    expect(JSON.stringify(res.body)).not.toContain("disk full");
  });

  test("сповіщення надсилається на WEBHOOK_URL при оцінці 1 або 2 без IP, а недоступний вебхук не зриває 201", async () => {
    const received = [];
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        received.push(JSON.parse(body));
        res.writeHead(200);
        res.end("ok");
      });
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;
    process.env.WEBHOOK_URL = `http://127.0.0.1:${port}/hook`;

    try {
      const app = createApp();
      const highRes = await request(app).post("/api/feedback").send({ lessonId: "L38", rating: 4, comment: "Ок" });
      expect(highRes.status).toBe(201);

      const lowRes = await request(app).post("/api/feedback").send({ lessonId: "L38", rating: 2, comment: "Погано" });
      expect(lowRes.status).toBe(201);

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({ lessonId: "L38", rating: 2, comment: "Погано" });
      expect(received[0]).not.toHaveProperty("ip");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }

    process.env.WEBHOOK_URL = "http://127.0.0.1:9/unreachable";
    const appUnreachable = createApp();
    jest.spyOn(console, "error").mockImplementation(() => {});
    const resUnreachable = await request(appUnreachable)
      .post("/api/feedback")
      .send({ lessonId: "L38", rating: 1, comment: "Критично" });

    expect(resUnreachable.status).toBe(201);
  });
});
