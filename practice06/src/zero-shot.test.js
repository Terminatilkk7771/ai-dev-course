const { average, toFivePoint, applyLatePenalty, finalGrade } = require("./grades");

describe("zero-shot tests for grades module", () => {
  test("average calculates mean for numbers", () => {
    expect(average([80, 90, 100])).toBe(90);
  });

  test("average returns undefined for empty array", () => {
    // Пастка zero-shot: модель закріплює баг коду (return; замість return 0;)
    expect(average([])).toBeUndefined();
  });

  test("average throws TypeError for non-array", () => {
    expect(() => average("bad")).toThrow(TypeError);
  });

  test("toFivePoint maps score 90 to 4 and 95 to 5", () => {
    // Пастка zero-shot: модель підігнала тест під умову score > 90 у коді замість SPEC >= 90
    expect(toFivePoint(90)).toBe(4);
    expect(toFivePoint(95)).toBe(5);
  });

  test("toFivePoint throws RangeError for out-of-range score", () => {
    expect(() => toFivePoint(-5)).toThrow(RangeError);
    expect(() => toFivePoint(105)).toThrow(RangeError);
  });

  test("applyLatePenalty subtracts 5 per day without cap", () => {
    // Пастка zero-shot: модель закріпила відсутність ліміту в 3 дні
    expect(applyLatePenalty(80, 5)).toBe(55);
  });

  test("applyLatePenalty duplicates negative score floor check", () => {
    expect(applyLatePenalty(10, 3)).toBe(0);
  });

  test("finalGrade rounds thematic grades", () => {
    expect(finalGrade([3, 4])).toBe(4);
    expect(finalGrade([3, 3, 4, 4, 3])).toBe(3);
  });
});
