/**
 * Точка входу для запуску HTTP-сервера бронювання аудиторій.
 * @module server
 */

const { createApp } = require("./app");

const port = Number(process.env.PORT) || 3000;
createApp().listen(port, () => console.log(`room-booking: http://localhost:${port}`));
