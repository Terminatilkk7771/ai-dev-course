/**
 * @typedef {import("./store").EventRegistry} EventRegistry
 * @typedef {import("./store").Participant} Participant
 */

/**
 * Нормалізує електронну пошту: прибирає пробіли по краях і приводить до нижнього регістру.
 *
 * @param {unknown} email вхідне значення пошти
 * @returns {string} нормалізований рядок або порожній рядок
 */
function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/**
 * Повертає індекс учасника в масиві за нормалізованою електронною поштою.
 *
 * @param {Participant[]} list список учасників
 * @param {string} normalizedEmail нормалізована адреса електронної пошти
 * @returns {number} індекс у списку або -1
 */
function findIndexByEmail(list, normalizedEmail) {
  return list.findIndex((item) => normalizeEmail(item.email) === normalizedEmail);
}

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

  const email = normalizeEmail(participant && participant.email);
  if (!isValidEmail(email)) {
    throw new TypeError("Некоректна електронна пошта");
  }

  const fullName = participant && typeof participant.fullName === "string" ? participant.fullName.trim() : "";
  if (fullName.length === 0) {
    throw new TypeError("Вкажіть ПІБ");
  }

  if (findIndexByEmail(registry.registered, email) !== -1 || findIndexByEmail(registry.waitlist, email) !== -1) {
    throw new Error("Учасник уже зареєстрований");
  }

  /** @type {Participant} */
  const entry = { email, fullName };
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

/**
 * Скасовує реєстрацію учасника за електронною поштою.
 * Якщо місце звільнилося в основному списку й черга не порожня — переводить першого з черги.
 *
 * @param {EventRegistry} registry сховище реєстрацій на подію
 * @param {string} email електронна пошта учасника
 * @returns {{ promoted: Participant | null }} об’єкт із переведеним учасником або null
 */
function cancelRegistration(registry, email) {
  if (!registry || !registry.event || !Array.isArray(registry.registered) || !Array.isArray(registry.waitlist)) {
    throw new TypeError("Некоректне сховище реєстрацій");
  }

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("Учасника не знайдено");
  }

  const regIndex = findIndexByEmail(registry.registered, normalizedEmail);
  if (regIndex !== -1) {
    registry.registered.splice(regIndex, 1);
    if (registry.waitlist.length > 0 && registry.registered.length < registry.event.capacity) {
      const promoted = registry.waitlist.shift();
      registry.registered.push(promoted);
      return { promoted };
    }
    return { promoted: null };
  }

  const waitIndex = findIndexByEmail(registry.waitlist, normalizedEmail);
  if (waitIndex !== -1) {
    registry.waitlist.splice(waitIndex, 1);
    return { promoted: null };
  }

  throw new Error("Учасника не знайдено");
}

module.exports = { registerParticipant, cancelRegistration };
