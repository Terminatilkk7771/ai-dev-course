const { average, toFivePoint, applyLatePenalty, finalGrade } = require("./grades");

describe("average (за SPEC.md)", () => {
  test("обчислює середнє арифметичне для масиву балів", () => {
    expect(average([80, 90, 100])).toBe(90);
    expect(average([75, 80])).toBe(77.5);
  });

  test("для масиву з одного елемента повертає цей елемент", () => {
    expect(average([0])).toBe(0);
    expect(average([100])).toBe(100);
  });

  test("для порожнього масиву повертає 0 (за SPEC.md)", () => {
    expect(average([])).toBe(0);
  });

  test("якщо аргумент не є масивом — кидає TypeError", () => {
    for (const invalid of [null, undefined, 100, "90", {}, { length: 0 }, { reduce: () => 1 }]) {
      expect(() => average(invalid)).toThrow(TypeError);
      expect(() => average(invalid)).toThrow("Очікується масив балів");
    }
  });
});

describe("toFivePoint (за SPEC.md)", () => {
  test("коректно переводить типові значення зі 100-бальної шкали", () => {
    expect(toFivePoint(95)).toBe(5);
    expect(toFivePoint(82)).toBe(4);
    expect(toFivePoint(67)).toBe(3);
    expect(toFivePoint(40)).toBe(2);
  });

  test("межі діапазонів включні: 100 → 5, 90 → 5, 89 → 4, 75 → 4, 74 → 3, 60 → 3, 59 → 2, 0 → 2", () => {
    expect(toFivePoint(100)).toBe(5);
    expect(toFivePoint(90)).toBe(5);
    expect(toFivePoint(89)).toBe(4);
    expect(toFivePoint(75)).toBe(4);
    expect(toFivePoint(74)).toBe(3);
    expect(toFivePoint(60)).toBe(3);
    expect(toFivePoint(59)).toBe(2);
    expect(toFivePoint(0)).toBe(2);
  });

  test("якщо бал виходить за межі 0–100 або не є числом — кидає RangeError", () => {
    for (const invalid of [-1, 101, NaN, "90", null, undefined]) {
      expect(() => toFivePoint(invalid)).toThrow(RangeError);
      expect(() => toFivePoint(invalid)).toThrow(/\S+/);
    }
  });
});

describe("applyLatePenalty (за SPEC.md)", () => {
  test("без запізнення (0 днів) штраф не застосовується", () => {
    expect(applyLatePenalty(85, 0)).toBe(85);
  });

  test("за 1–3 дні запізнення зменшує бал на 5 за кожен день", () => {
    expect(applyLatePenalty(85, 1)).toBe(80);
    expect(applyLatePenalty(85, 2)).toBe(75);
    expect(applyLatePenalty(85, 3)).toBe(70);
  });

  test("враховує не більше 3 днів запізнення (максимальний штраф — 15 балів)", () => {
    expect(applyLatePenalty(85, 4)).toBe(70);
    expect(applyLatePenalty(80, 5)).toBe(65);
    expect(applyLatePenalty(100, 10)).toBe(85);
  });

  test("результат не може бути меншим за 0", () => {
    expect(applyLatePenalty(10, 3)).toBe(0);
    expect(applyLatePenalty(0, 2)).toBe(0);
  });

  test("якщо daysLate не є цілим невід’ємним числом — кидає RangeError", () => {
    for (const invalidDays of [-1, 1.5, NaN, "2", null]) {
      expect(() => applyLatePenalty(80, invalidDays)).toThrow(RangeError);
      expect(() => applyLatePenalty(80, invalidDays)).toThrow(/\S+/);
    }
  });
});

describe("finalGrade (за SPEC.md)", () => {
  test("округлює середнє тематичних оцінок за математичними правилами (3.5 → 4, 3.4 → 3)", () => {
    expect(finalGrade([3, 4])).toBe(4);
    expect(finalGrade([3, 3, 4, 4, 3])).toBe(3);
    expect(finalGrade([5, 5, 4])).toBe(5);
    expect(finalGrade([2, 2, 3])).toBe(2);
  });

  test("коректно приймає граничні оцінки 2 і 5", () => {
    expect(finalGrade([2])).toBe(2);
    expect(finalGrade([5])).toBe(5);
  });

  test("для порожнього масиву або не-масиву кидає Error", () => {
    for (const invalid of [[], null, undefined, "5"]) {
      expect(() => finalGrade(invalid)).toThrow(Error);
      expect(() => finalGrade(invalid)).toThrow(/\S+/);
    }
  });

  test("якщо хоча б одна оцінка не є цілим числом від 2 до 5 — кидає RangeError", () => {
    for (const badList of [[1], [6], [3.5], ["4"], [5, 0]]) {
      expect(() => finalGrade(badList)).toThrow(RangeError);
      expect(() => finalGrade(badList)).toThrow(/\S+/);
    }
  });
});
