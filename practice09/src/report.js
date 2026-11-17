// Формування відомості успішності групи
// Написано кілька років тому, працює, тестів немає.
function average(values) {
  if (values.length === 0) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
  }
  return sum / values.length;
}

function gradeName(score) {
  if (score >= 4.5) {
    return "відмінно";
  } else {
    if (score >= 3.5) {
      return "добре";
    } else {
      if (score >= 2.5) {
        return "задовільно";
      } else {
        return "незадовільно";
      }
    }
  }
}

function formatDisplayName(name, isShort) {
  if (!isShort) {
    return name;
  }
  const parts = name.split(" ");
  return parts[0] + " " + parts[1][0] + ".";
}

function formatScore(score) {
  return score.toFixed(1) + " (" + gradeName(score) + ")";
}

function formatStudentLine(student, score, isShort) {
  const baseLine = formatDisplayName(student.name, isShort) + " — " + formatScore(score);
  if (score < 2.5) {
    return baseLine + " [!]";
  }
  return baseLine;
}

function buildReport(data, opts) {
  let report = "";
  const attentionStudents = [];
  const isShort = Boolean(opts && opts.short);
  report += "Відомість успішності\n";
  report += "Група: " + data.group + "\n";
  report += "------------------------------\n";
  const studentAverages = [];
  for (let i = 0; i < data.students.length; i++) {
    const student = data.students[i];
    const studentAverage = average(student.grades);
    if (studentAverage < 2.5) {
      attentionStudents.push(student.name);
    }
    report += formatStudentLine(student, studentAverage, isShort) + "\n";
    studentAverages.push(studentAverage);
  }
  report += "------------------------------\n";
  const groupAverage = average(studentAverages);
  report += "Середній бал групи: " + formatScore(groupAverage) + "\n";
  if (attentionStudents.length > 0) {
    report += "Потребують уваги: " + attentionStudents.join(", ") + "\n";
  } else {
    report += "Потребують уваги: немає\n";
  }
  return report;
}

module.exports = { buildReport };
