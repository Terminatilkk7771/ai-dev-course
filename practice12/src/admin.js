const crypto = require("node:crypto");

const tokens = new Set();

function safeCompareStrings(a, b) {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function neutralizeFormula(str) {
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function escapeCsvCell(value) {
  const str = neutralizeFormula(String(value ?? ""));
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values) {
  return values.map(escapeCsvCell).join(",");
}

function requireAdmin(req, res, next) {
  const header = req.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Потрібна авторизація" });
  }
  const token = header.slice(7);
  if (!tokens.has(token)) {
    return res.status(401).json({ error: "Недійсний токен" });
  }
  return next();
}

function adminRoutes(app, store) {
  app.post("/api/admin/login", (req, res) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const provided = req.body && req.body.password;
    if (!adminPassword || typeof provided !== "string" || !safeCompareStrings(provided, adminPassword)) {
      return res.status(401).json({ error: "Невірний пароль" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    tokens.add(token);
    return res.json({ token });
  });

  app.get("/api/admin/export.csv", requireAdmin, (req, res) => {
    const rows = store.all().map((f) =>
      toCsvRow([f.lessonId, f.rating, f.comment, new Date(f.createdAt).toISOString()])
    );
    return res.type("text/csv").send(["lessonId,rating,comment,createdAt", ...rows].join("\n"));
  });
}

async function notifyLowRating(feedback) {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    if (!response.ok) {
      console.error(`Помилка вебхука: HTTP ${response.status}`);
    }
  } catch (err) {
    console.error("Помилка надсилання сповіщення на вебхук:", err.message);
  }
}

module.exports = { adminRoutes, notifyLowRating, toCsvRow };
