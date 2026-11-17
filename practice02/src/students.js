/** @typedef {import("./models").Student} Student */

/**
 * Повертає масив унікальних адрес електронної пошти студентів у нижньому регістрі,
 * без пробілів на початку й у кінці. Порожні адреси ігноруються.
 * Порядок адрес відповідає першій появі.
 *
 * @param {Student[]} students список здобувачів освіти
 * @returns {string[]} масив унікальних адрес електронної пошти
 */
function uniqueEmails(students) {
  if (!Array.isArray(students)) {
    return [];
  }
  const seen = new Set();
  for (const student of students) {
    if (!student || typeof student.email !== "string") {
      continue;
    }
    const normalized = student.email.trim().toLowerCase();
    if (normalized.length > 0) {
      seen.add(normalized);
    }
  }
  return Array.from(seen);
}

/**
 * Обчислює середнє арифметичне балів, округлене до одного знака після коми.
 * Для порожнього масиву повертає 0.
 *
 * @param {number[]} scores бали за 100-бальною шкалою
 * @returns {number} середній бал, округлений до 0,1, або 0 для порожнього масиву
 */
function calculateAverageGrade(scores) {
  if (!Array.isArray(scores) || scores.length === 0) {
    return 0;
  }
  let sum = 0;
  let count = 0;
  for (const score of scores) {
    if (typeof score === "number" && Number.isFinite(score)) {
      sum += score;
      count += 1;
    }
  }
  if (count === 0) {
    return 0;
  }
  return Math.round((sum / count) * 10) / 10;
}

/**
 * Форматує повне ім’я здобувача освіти у вигляд «Прізвище І. П.».
 * Зайві пробіли ігноруються.
 *
 * @param {string} fullName повне ім’я здобувача освіти
 * @returns {string} відформатоване скорочене ім’я
 */
function formatStudentName(fullName) {
  if (typeof fullName !== "string") {
    return "";
  }
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1) {
    return parts[0];
  }
  const [lastName, ...rest] = parts;
  const initials = rest.map((part) => `${part[0]}.`).join(" ");
  return `${lastName} ${initials}`;
}

/**
 * Обчислює середнє всіх балів студентів групи groupCode, округлене до 0,1.
 * Якщо в групі немає здобувачів або балів — повертає null.
 *
 * @param {Student[]} students список здобувачів освіти
 * @param {string} groupCode шифр навчальної групи
 * @returns {number | null} середній бал групи або null
 */
function groupAverage(students, groupCode) {
  if (!Array.isArray(students) || typeof groupCode !== "string") {
    return null;
  }
  const allScores = [];
  for (const student of students) {
    if (
      student &&
      student.groupCode === groupCode &&
      Array.isArray(student.scores)
    ) {
      for (const score of student.scores) {
        if (typeof score === "number" && Number.isFinite(score)) {
          allScores.push(score);
        }
      }
    }
  }
  if (allScores.length === 0) {
    return null;
  }
  return calculateAverageGrade(allScores);
}

module.exports = {
  uniqueEmails,
  calculateAverageGrade,
  formatStudentName,
  groupAverage,
};
