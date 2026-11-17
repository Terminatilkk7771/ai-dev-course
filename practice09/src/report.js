// Формування відомості успішності групи
function average(values) {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
}

const GRADE_LEVELS = [
  { min: 4.5, label: "відмінно" },
  { min: 3.5, label: "добре" },
  { min: 2.5, label: "задовільно" },
];

function gradeName(score) {
  const matched = GRADE_LEVELS.find((level) => score >= level.min);
  return matched ? matched.label : "незадовільно";
}

function formatDisplayName(name, isShort) {
  if (!isShort) {
    return name;
  }
  const [lastName, firstName] = name.split(" ");
  return `${lastName} ${firstName[0]}.`;
}

function formatScore(score) {
  return `${score.toFixed(1)} (${gradeName(score)})`;
}

function formatStudentLine(student, score, isShort) {
  const baseLine = `${formatDisplayName(student.name, isShort)} — ${formatScore(score)}`;
  const marker = score < 2.5 ? " [!]" : "";
  return `${baseLine}${marker}`;
}

function buildReport(data, opts) {
  const isShort = Boolean(opts && opts.short);
  const entries = data.students.map((student) => ({
    student,
    score: average(student.grades),
  }));
  const studentLines = entries.map((entry) =>
    formatStudentLine(entry.student, entry.score, isShort)
  );
  const groupAverage = average(entries.map((entry) => entry.score));
  const attentionStudents = entries
    .filter((entry) => entry.score < 2.5)
    .map((entry) => entry.student.name);
  const attentionText = attentionStudents.length > 0 ? attentionStudents.join(", ") : "немає";

  const lines = [
    "Відомість успішності",
    `Група: ${data.group}`,
    "------------------------------",
    ...studentLines,
    "------------------------------",
    `Середній бал групи: ${formatScore(groupAverage)}`,
    `Потребують уваги: ${attentionText}`,
  ];
  return `${lines.join("\n")}\n`;
}

module.exports = { buildReport };
