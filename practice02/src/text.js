/**
 * Повертає найдовше слово рядка.
 * Словом вважається послідовність літер або цифр (зокрема українських).
 * Якщо таких кілька — повертає перше. Для порожнього рядка — "".
 *
 * @param {string} text вхідний текст
 * @returns {string} найдовше слово або порожній рядок
 */
function longestWord(text) {
  if (typeof text !== "string" || text.length === 0) {
    return "";
  }
  const words = text.match(/[\p{L}\p{N}]+/gu);
  if (!words) {
    return "";
  }
  let best = "";
  for (const word of words) {
    if (word.length > best.length) {
      best = word;
    }
  }
  return best;
}

module.exports = { longestWord };
