/** @typedef {import("./store").Participant} Participant */

/**
 * Нормалізує адресу електронної пошти: без пробілів по краях, нижній регістр.
 *
 * @param {unknown} email вхідна пошта
 * @returns {string} нормалізована адреса
 */
function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * Перевіряє формат пошти: є «@», перед ним є символи, після нього — домен із крапкою.
 *
 * @param {string} email нормалізована адреса
 * @returns {boolean} true, якщо формат коректний
 */
function isValidEmail(email) {
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@")) {
    return false;
  }
  const domain = email.slice(at + 1);
  return (
    domain.includes(".") &&
    !domain.startsWith(".") &&
    !domain.endsWith(".") &&
    !domain.includes("..")
  );
}

/**
 * Перевіряє й нормалізує дані учасника, повертаючи новий об’єкт без мутації вхідного.
 *
 * @param {Participant} participant вхідні дані учасника
 * @returns {Participant} нормалізована копія об’єкта учасника
 */
function validateParticipant(participant) {
  if (!participant || typeof participant !== "object") {
    throw new TypeError("Некоректні дані учасника");
  }

  const email = normalizeEmail(participant.email);
  if (!isValidEmail(email)) {
    throw new TypeError("Некоректна електронна пошта");
  }

  const fullName = String(participant.fullName ?? "").trim();
  if (!fullName) {
    throw new TypeError("Вкажіть ПІБ");
  }

  /** @type {Participant} */
  const normalized = { email, fullName };
  if (participant.group !== undefined && participant.group !== null) {
    const group = String(participant.group).trim();
    if (group) {
      normalized.group = group;
    }
  }
  return normalized;
}

module.exports = { validateParticipant, normalizeEmail, isValidEmail };
