const events = require("./events");

const journal = [];

events.on("loan:returned", ({ loan, reader, overdueDays, fine }) => {
  if (fine > 0) {
    journal.push({
      loanId: loan.id,
      readerId: reader.id,
      reader: reader.name,
      overdueDays,
      fine,
    });
  }
});

function getJournal() {
  return [...journal];
}

function clearJournal() {
  journal.length = 0;
}

module.exports = { getJournal, clearJournal };
