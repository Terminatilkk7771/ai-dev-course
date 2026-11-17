const { PAGE_SIZE } = require("./config");

/** Сторінка списку студентів; page починається з 1 */
function listStudents(db, page) {
  if (!Number.isInteger(page) || page < 1) {
    return [];
  }
  const offset = (page - 1) * PAGE_SIZE;
  return db
    .prepare("SELECT id, name, group_name FROM students ORDER BY id LIMIT ? OFFSET ?")
    .all(PAGE_SIZE, offset);
}

/** Безпечний пошук студентів за частиною імені з екрануванням спецсимволів LIKE */
function findByName(db, name) {
  const safeName = String(name ?? "").replace(/[\\%_]/g, "\\$&");
  return db
    .prepare("SELECT id, name, group_name FROM students WHERE name LIKE ? ESCAPE '\\' ORDER BY id")
    .all(`%${safeName}%`);
}

function getById(db, id) {
  return db.prepare("SELECT id, name, group_name FROM students WHERE id = ?").get(id);
}

/** Середній бал студента, округлений до десятих, або null за відсутності оцінок */
function averageGrade(db, id) {
  const rows = db.prepare("SELECT value FROM grades WHERE student_id = ?").all(id);
  if (rows.length === 0) return null;
  const sum = rows.reduce((acc, r) => acc + r.value, 0);
  return Math.round((sum / rows.length) * 10) / 10;
}

function deleteStudent(db, id) {
  db.prepare("DELETE FROM grades WHERE student_id = ?").run(id);
  return db.prepare("DELETE FROM students WHERE id = ?").run(id).changes > 0;
}

module.exports = { listStudents, findByName, getById, averageGrade, deleteStudent };
