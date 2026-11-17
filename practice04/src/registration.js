/**
 * @typedef {import("./store").EventRegistry} EventRegistry
 * @typedef {import("./store").Participant} Participant
 */

/**
 * Перевіряє коректність нормалізованої електронної пошти:
 * наявність непорожньої локальної частини, символу '@' та домену з крапкою.
 *
 * @param {string} email нормалізована адреса електронної пошти
 * @returns {boolean} true, якщо формат коректний
 */
function isValidEmail(email) {
  if (!email) {
    return false;
  }
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) {
    return false;
  }
  const domain = email.slice(atIndex + 1);
  const dotIndex = domain.indexOf(".");
  return dotIndex > 0 && dotIndex < domain.length - 1 && !domain.includes("..");
}

/**
 * Реєструє учасника на подію коледжу в основний список або лист очікування.
 *
 * @param {EventRegistry} registry сховище реєстрацій на подію
 * @param {Participant} participant дані учасника (email, fullName, [group])
 * @param {Date} [now=new Date()] поточна дата й час для перевірки дедлайну
 * @returns {{ status: "registered" } | { status: "waitlisted", position: number }}
 */
function registerParticipant(registry, participant, now = new Date()) {
  if (!registry || !registry.event || !Array.isArray(registry.registered) || !Array.isArray(registry.waitlist)) {
    throw new TypeError("Некоректне сховище реєстрацій");
  }

  const currentMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const closesMs = new Date(registry.event.registrationClosesAt).getTime();
  if (Number.isNaN(currentMs) || Number.isNaN(closesMs) || currentMs >= closesMs) {
    throw new Error("Реєстрацію закрито");
  }

  const rawEmail = participant && typeof participant.email === "string" ? participant.email.trim().toLowerCase() : "";
  if (!isValidEmail(rawEmail)) {
    throw new TypeError("Некоректна електронна пошта");
  }

  const fullName = participant && typeof participant.fullName === "string" ? participant.fullName.trim() : "";
  if (fullName.length === 0) {
    throw new TypeError("Вкажіть ПІБ");
  }

  const isDuplicate = (list) =>
    list.some((item) => typeof item.email === "string" && item.email.trim().toLowerCase() === rawEmail);
  if (isDuplicate(registry.registered) || isDuplicate(registry.waitlist)) {
    throw new Error("Учасник уже зареєстрований");
  }

  /** @type {Participant} */
  const entry = {
    email: rawEmail,
    fullName,
  };
  if (participant.group !== undefined && participant.group !== null) {
    const trimmedGroup = String(participant.group).trim();
    if (trimmedGroup.length > 0) {
      entry.group = trimmedGroup;
    }
  }

  if (registry.registered.length < registry.event.capacity) {
    registry.registered.push(entry);
    return { status: "registered" };
  }

  registry.waitlist.push(entry);
  return { status: "waitlisted", position: registry.waitlist.length };
}

module.exports = { registerParticipant };
