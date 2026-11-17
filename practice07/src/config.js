// Налаштування застосунку: секрет зчитується лише зі змінної середовища
const TOKEN_SECRET = process.env.TOKEN_SECRET;
if (!TOKEN_SECRET) {
  throw new Error("Змінну середовища TOKEN_SECRET не задано");
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  PAGE_SIZE: 5,
  TOKEN_SECRET,
};
