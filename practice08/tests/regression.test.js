const {
  dueDate,
  calculateFine,
  canBorrow,
  issueBook,
} = require("../src/library");

describe("Регресійні тести за ISSUES.md", () => {
  test("Звіт № 1: dueDate не змінює передану дату видачі", () => {
    const issued = new Date(2026, 8, 10);
    const due = dueDate(issued);

    expect(issued.getFullYear()).toBe(2026);
    expect(issued.getMonth()).toBe(8);
    expect(issued.getDate()).toBe(10);

    expect(due.getFullYear()).toBe(2026);
    expect(due.getMonth()).toBe(8);
    expect(due.getDate()).toBe(24);
  });

  test("Звіт № 1: issueBook зберігає вихідну issuedAt окремо від due", () => {
    const loans = [
      {
        readerId: 10,
        bookId: "book-0",
        issuedAt: new Date(2026, 7, 1),
        due: new Date(2026, 7, 15),
        returnedAt: new Date(2026, 7, 10),
      },
    ];
    const reader = { id: 10, card: "KP-0100/26", active: true };
    const issueDate = new Date(2026, 8, 10);

    const loan = issueBook(loans, reader, "book-1", issueDate);

    expect(issueDate.getDate()).toBe(10);
    expect(loan.issuedAt.getDate()).toBe(10);
    expect(loan.due.getDate()).toBe(24);
    expect(loan.issuedAt.getTime()).not.toBe(loan.due.getTime());
  });

  test("Звіт № 2: calculateFine коректно рахує дні прострочення на межі місяців (28.09 -> 03.10)", () => {
    const due = new Date(2026, 8, 28);
    const returned = new Date(2026, 9, 3);

    expect(calculateFine(due, returned)).toBe(25);
  });

  test("Звіт № 2: calculateFine коректно рахує дні через перехід на зимовий і літній час", () => {
    expect(
      calculateFine(new Date(2026, 9, 24), new Date(2026, 9, 26))
    ).toBe(10);
    expect(
      calculateFine(new Date(2026, 2, 28), new Date(2026, 2, 30))
    ).toBe(10);
    expect(
      calculateFine(new Date(2026, 8, 28), new Date(2026, 8, 28))
    ).toBe(0);
    expect(
      calculateFine(new Date(2026, 8, 1), new Date(2026, 9, 10))
    ).toBe(100);
  });

  test("Звіт № 3: canBorrow повертає true для нового активного читача без історії видач", () => {
    const newReader = { id: 99, card: "ZV-0456/26", active: true };

    expect(canBorrow(newReader, [])).toBe(true);
    expect(
      canBorrow(newReader, [
        { readerId: 1, bookId: "b1", issuedAt: new Date(2026, 8, 1), due: new Date(2026, 8, 15), returnedAt: null },
      ])
    ).toBe(true);
  });

  test("Звіт № 3: issueBook видає книгу новому читачеві без винятку, а неактивному — відмовляє", () => {
    const newReader = { id: 99, card: "ZV-0456/26", active: true };
    const inactiveReader = { id: 100, card: "ZV-0457/26", active: false };
    const loans = [];

    const loan = issueBook(loans, newReader, "book-42", new Date(2026, 8, 10));
    expect(loan.readerId).toBe(99);
    expect(loans).toHaveLength(1);

    expect(canBorrow(inactiveReader, loans)).toBe(false);
    expect(() =>
      issueBook(loans, inactiveReader, "book-43", new Date(2026, 8, 10))
    ).toThrow("Видачу заборонено");
  });
});
