const { buildReport } = require("../src/report");
const groupFixture = require("./fixtures/group.json");

describe("Характеризаційні тести для buildReport (поточна поведінка)", () => {
  test("повний текст відомості на tests/fixtures/group.json у звичайному режимі", () => {
    expect(buildReport(groupFixture)).toMatchSnapshot();
  });

  test("повний текст відомості на tests/fixtures/group.json у скороченому режимі (opts.short)", () => {
    expect(buildReport(groupFixture, { short: true })).toMatchSnapshot();
  });

  test("порожня група формує нульовий середній бал без студентів до уваги", () => {
    const emptyGroup = { group: "100-Т", students: [] };
    const report = buildReport(emptyGroup);

    expect(report).toContain("Група: 100-Т\n");
    expect(report).toContain("Середній бал групи: 0.0 (незадовільно)\n");
    expect(report).toContain("Потребують уваги: немає\n");
  });

  test("дивність: студент без оцінок отримує 0.0 [!], потрапляє до уваги та знижує середній бал групи", () => {
    const data = {
      group: "201-А",
      students: [
        { name: "Іваненко Олег", grades: [5, 5] },
        { name: "Петренко Анна", grades: [] },
      ],
    };

    const report = buildReport(data);

    expect(report).toContain("Іваненко Олег — 5.0 (відмінно)\n");
    expect(report).toContain("Петренко Анна — 0.0 (незадовільно) [!]\n");
    expect(report).toContain("Середній бал групи: 2.5 (задовільно)\n");
    expect(report).toContain("Потребують уваги: Петренко Анна\n");
  });

  test("межові значення шкали оцінювання: 4.5, 3.5, 2.5 та нижче 2.5", () => {
    const boundary = {
      group: "301-Б",
      students: [
        { name: "Межа Відмінно", grades: [4, 5] },
        { name: "Межа Добре", grades: [3, 4] },
        { name: "Межа Задовільно", grades: [2, 3] },
        { name: "Нижче Порогу", grades: [2, 2.9] },
      ],
    };

    const report = buildReport(boundary);

    expect(report).toContain("Межа Відмінно — 4.5 (відмінно)\n");
    expect(report).toContain("Межа Добре — 3.5 (добре)\n");
    expect(report).toContain("Межа Задовільно — 2.5 (задовільно)\n");
    expect(report).toContain("Нижче Порогу — 2.5 (незадовільно) [!]\n");
  });

  test("середній бал групи також точно розрізняє рівні на межах шкали", () => {
    const excellent = buildReport({
      group: "Г1",
      students: [{ name: "Студент А", grades: [4.5] }],
    });
    const good = buildReport({
      group: "Г2",
      students: [{ name: "Студент Б", grades: [3.5] }],
    });
    const satisfactory = buildReport({
      group: "Г3",
      students: [{ name: "Студент В", grades: [2.5] }],
    });

    expect(excellent).toContain("Середній бал групи: 4.5 (відмінно)\n");
    expect(excellent).toContain("Потребують уваги: немає\n");
    expect(good).toContain("Середній бал групи: 3.5 (добре)\n");
    expect(satisfactory).toContain("Середній бал групи: 2.5 (задовільно)\n");
  });

  test("значення параметра opts: undefined, null та {} поводяться однаково як звичайний режим", () => {
    const sample = {
      group: "456-Д",
      students: [{ name: "Коваль Андрій", grades: [5, 4] }],
    };

    const withUndefined = buildReport(sample, undefined);
    const withNull = buildReport(sample, null);
    const withEmpty = buildReport(sample, {});

    expect(withNull).toBe(withUndefined);
    expect(withEmpty).toBe(withUndefined);
    expect(withUndefined).toContain("Коваль Андрій — 4.5 (відмінно)\n");
  });
});
