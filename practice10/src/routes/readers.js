const express = require("express");

function readersRouter(service) {
  const router = express.Router();

  router.get("/:id/fines", (req, res) => {
    const rawId = req.params.id;
    if (!/^[1-9]\d*$/.test(rawId)) {
      return res.status(400).json({ error: "Некоректний ідентифікатор читача" });
    }
    const readerId = Number(rawId);

    const isLibrarian = req.user.role === "librarian";
    const isOwnReader = req.user.role === "reader" && req.user.readerId === readerId;
    if (!isLibrarian && !isOwnReader) {
      return res.status(403).json({ error: "Недостатньо прав" });
    }

    return res.json(service.readerFines(readerId));
  });

  return router;
}

module.exports = { readersRouter };
