// Повертає сторінку списку. Нумерація сторінок починається з 1.
function paginate(items, page, size) {
  if (!Array.isArray(items) || page < 1 || size <= 0) {
    return [];
  }
  const start = (page - 1) * size;
  return items.slice(start, start + size);
}
module.exports = { paginate };
