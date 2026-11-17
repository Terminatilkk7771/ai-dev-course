const { calculateAverageGrade } = require("./students");

/**
 * @typedef {import("./models").Student} Student
 */

/**
 * Навчальна група здобувачів освіти.
 */
class StudyGroup {
  /**
   * Створює екземпляр навчальної групи.
   *
   * @param {string} code шифр академічної групи
   * @param {number} year рік вступу або навчання
   */
  constructor(code, year) {
    /** @type {string} */
    this.code = code;
    /** @type {number} */
    this.year = year;
    /** @type {Student[]} */
    this.students = [];
  }

  /**
   * Додає здобувача до групи після перевірки шифру групи та унікальності id.
   *
   * @param {Student} student об'єкт здобувача освіти
   * @throws {Error} якщо дані некоректні, шифр групи не збігається або здобувач уже є в групі
   */
  addStudent(student) {
    if (!student || typeof student !== "object") {
      throw new Error("Дані здобувача мають бути коректним об'єктом.");
    }
    if (student.groupCode !== this.code) {
      throw new Error(
        `Здобувач належить до групи "${student.groupCode}", а не "${this.code}".`
      );
    }
    if (this.students.some((existing) => existing.id === student.id)) {
      throw new Error(`Здобувач з ідентифікатором ${student.id} уже є у групі.`);
    }

    this.students.push({
      ...student,
      scores: Array.isArray(student.scores) ? [...student.scores] : [],
    });
  }

  /**
   * Обчислює загальний середній бал усіх оцінок здобувачів групи з точністю до 0,1.
   *
   * @returns {number} середній бал групи або 0, якщо оцінок немає
   */
  averageScore() {
    const allScores = this.students.flatMap((student) =>
      Array.isArray(student.scores) ? student.scores : []
    );
    return calculateAverageGrade(allScores);
  }

  /**
   * Повертає перших n здобувачів групи, впорядкованих за спаданням середнього балу,
   * а за рівності балів — за абеткою повного імені (українська локаль).
   *
   * @param {number} n кількість здобувачів у рейтингу
   * @returns {Student[]} відсортований масив найкращих здобувачів
   */
  topStudents(n) {
    const limit = typeof n === "number" ? Math.max(0, n) : this.students.length;
    return [...this.students]
      .sort((a, b) => {
        const diff =
          calculateAverageGrade(b.scores) - calculateAverageGrade(a.scores);
        if (diff !== 0) {
          return diff;
        }
        return String(a.fullName).localeCompare(String(b.fullName), "uk");
      })
      .slice(0, limit);
  }
}

module.exports = { StudyGroup };
