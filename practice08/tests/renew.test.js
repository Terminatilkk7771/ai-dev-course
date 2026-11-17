const {
  RENEW_DAYS,
  dueDate,
  issueBook,
  returnBook,
  renewLoan,
} = require("../src/library");

describe("Правило 5: продовження видачі (renewLoan)", () => {
  function makeActiveLoan(issue = new Date(2026, 8, 1)) {
    const loans = [];
    const reader = { id: 7, card: "KP-0707/26", active: true };
    return issueBook(loans, reader, "book-5", issue);
  }

  test("продовжує книгу на 7 днів до дати повернення (до терміну і в день терміну включно)", () => {
    const loan = makeActiveLoan(new Date(2026, 8, 1)); // due: 2026-09-15

    const renewedBeforeDue = renewLoan(loan, new Date(2026, 8, 10));
    expect(RENEW_DAYS).toBe(7);
    expect(renewedBeforeDue.due.getFullYear()).toBe(2026);
    expect(renewedBeforeDue.due.getMonth()).toBe(8);
    expect(renewedBeforeDue.due.getDate()).toBe(22);
    expect(renewedBeforeDue.renewed).toBe(true);

    const renewedOnDueDay = renewLoan(loan, new Date(2026, 8, 15, 23, 59));
    expect(renewedOnDueDay.due.getDate()).toBe(22);
    expect(renewedOnDueDay.renewed).toBe(true);
  });

  test("не змінює вихідний об'єкт loan та його дати (іммутабельність)", () => {
    const loan = makeActiveLoan(new Date(2026, 8, 20)); // due: 2026-10-04
    const originalDueMs = loan.due.getTime();
    const originalIssuedMs = loan.issuedAt.getTime();

    const updated = renewLoan(loan, new Date(2026, 8, 25));

    expect(updated).not.toBe(loan);
    expect(loan.due.getTime()).toBe(originalDueMs);
    expect(loan.issuedAt.getTime()).toBe(originalIssuedMs);
    expect(loan.renewed).toBeFalsy();
    expect(updated.due.getMonth()).toBe(9);
    expect(updated.due.getDate()).toBe(11);
  });

  test("забороняє повторне продовження однієї й тієї самої видачі", () => {
    const loan = makeActiveLoan(new Date(2026, 8, 1));
    const renewedOnce = renewLoan(loan, new Date(2026, 8, 10));

    expect(() => renewLoan(renewedOnce, new Date(2026, 8, 12))).toThrow(
      "Книгу вже продовжували"
    );
  });

  test("забороняє продовження вже поверненої книги", () => {
    const loan = makeActiveLoan(new Date(2026, 8, 1));
    returnBook(loan, new Date(2026, 8, 5));

    expect(() => renewLoan(loan, new Date(2026, 8, 6))).toThrow(
      "Книгу вже повернено"
    );
  });

  test("забороняє продовження після закінчення терміну повернення", () => {
    const loan = makeActiveLoan(new Date(2026, 8, 1)); // due: 2026-09-15

    expect(() => renewLoan(loan, new Date(2026, 8, 16))).toThrow(
      "Термін повернення вже минув"
    );
  });

  test("коректно додає 7 календарних днів на межі місяця і під час переведення годинника", () => {
    const autumnLoan = {
      readerId: 8,
      bookId: "book-dst",
      issuedAt: new Date(2026, 9, 10),
      due: dueDate(new Date(2026, 9, 10)), // 2026-10-24
      returnedAt: null,
    };

    const renewed = renewLoan(autumnLoan, new Date(2026, 9, 24));
    expect(renewed.due.getFullYear()).toBe(2026);
    expect(renewed.due.getMonth()).toBe(9);
    expect(renewed.due.getDate()).toBe(31);
  });
});
