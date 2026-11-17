const express = require("express");
const students = require("./students");
const { requireAuth, requireRole, login } = require("./auth");

/** Екранує небезпечні HTML-символи для запобігання XSS */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Перевіряє, що :id — додатне ціле число */
function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Некоректний ідентифікатор" });
  }
  req.studentId = id;
  next();
}

function createApp(db) {
  const app = express();
  app.use(express.json());

  app.post("/api/login", (req, res) => {
    const { login: loginName, password } = req.body || {};
    const token = login(db, loginName, password);
    if (!token) return res.status(401).json({ error: "Невірний логін або пароль" });
    res.json({ token });
  });

  app.get("/api/students", (req, res) => {
    let page = 1;
    if (req.query.page !== undefined) {
      page = Number(req.query.page);
      if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({ error: "Некоректний номер сторінки" });
      }
    }
    res.json(students.listStudents(db, page));
  });

  app.get("/api/students/search", (req, res) => {
    const name = typeof req.query.name === "string" ? req.query.name : "";
    res.json(students.findByName(db, name));
  });

  app.get("/api/students/:id/average", validateId, (req, res) => {
    if (!students.getById(db, req.studentId)) return res.status(404).json({ error: "Студента не знайдено" });
    res.json({ average: students.averageGrade(db, req.studentId) });
  });

  app.get("/api/students/:id/card", validateId, (req, res) => {
    const s = students.getById(db, req.studentId);
    if (!s) return res.status(404).send("Студента не знайдено");
    const avg = students.averageGrade(db, req.studentId);
    const avgText = avg === null ? "оцінок немає" : String(avg);
    res
      .type("html")
      .send(
        `<h1>${escapeHtml(s.name)}</h1><p>Група: ${escapeHtml(s.group_name)}</p><p>Середній бал: ${escapeHtml(avgText)}</p>`
      );
  });

  app.delete("/api/students/:id", requireAuth, requireRole("teacher"), validateId, (req, res) => {
    if (!students.deleteStudent(db, req.studentId)) return res.status(404).json({ error: "Студента не знайдено" });
    res.status(204).end();
  });

  app.use((err, req, res, next) => {
    if (err && (err.type === "entity.parse.failed" || err.status === 400)) {
      return res.status(400).json({ error: "Некоректні вхідні дані" });
    }
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  });

  return app;
}

module.exports = { createApp, escapeHtml };
