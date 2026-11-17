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

function buildReport(data, opts) {
  let report = "";
  const attentionStudents = [];
  report += "Відомість успішності\n";
  report += "Група: " + data.group + "\n";
  report += "------------------------------\n";
  const studentAverages = [];
  for (let i = 0; i < data.students.length; i++) {
    const student = data.students[i];
    const studentAverage = average(student.grades);
    let studentLevel = "";
    if (studentAverage >= 4.5) {
      studentLevel = "відмінно";
    } else {
      if (studentAverage >= 3.5) {
        studentLevel = "добре";
      } else {
        if (studentAverage >= 2.5) {
          studentLevel = "задовільно";
        } else {
          studentLevel = "незадовільно";
        }
      }
    }
    let line = "";
    if (opts && opts.short) {
      line =
        student.name.split(" ")[0] +
        " " +
        student.name.split(" ")[1][0] +
        ". — " +
        studentAverage.toFixed(1) +
        " (" +
        studentLevel +
        ")";
    } else {
      line = student.name + " — " + studentAverage.toFixed(1) + " (" + studentLevel + ")";
    }
    if (studentAverage < 2.5) {
      line = line + " [!]";
      attentionStudents.push(student.name);
    }
    report += line + "\n";
    studentAverages.push(studentAverage);
  }
  report += "------------------------------\n";
  const groupAverage = average(studentAverages);
  let groupLevel = "";
  if (groupAverage >= 4.5) {
    groupLevel = "відмінно";
  } else {
    if (groupAverage >= 3.5) {
      groupLevel = "добре";
    } else {
      if (groupAverage >= 2.5) {
        groupLevel = "задовільно";
      } else {
        groupLevel = "незадовільно";
      }
    }
  }
  report += "Середній бал групи: " + groupAverage.toFixed(1) + " (" + groupLevel + ")\n";
  if (attentionStudents.length > 0) {
    report += "Потребують уваги: " + attentionStudents.join(", ") + "\n";
  } else {
    report += "Потребують уваги: немає\n";
  }
  return report;
}

module.exports = { buildReport };
