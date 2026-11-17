const crypto = require("node:crypto");
const { TOKEN_SECRET } = require("./config");

/**
 * Гешує пароль за допомогою scrypt із випадковою 16-байтною сіллю.
 * @param {string} password
 * @returns {string}
 */
function hashPassword(password) {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("Пароль має бути непорожнім рядком");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

/**
 * Перевіряє пароль проти збереженого гешу у форматі salt:hash.
 * @param {string} password
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const expectedBuf = Buffer.from(keyHex, "hex");
  if (expectedBuf.length === 0) return false;
  const actualBuf = crypto.scryptSync(password, salt, expectedBuf.length);
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

function sign(payload) {
  return crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
}

/** Токен має вигляд base64url(payload).підпис */
function createToken(login, role) {
  const payload = Buffer.from(JSON.stringify({ login, role }), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (typeof token !== "string" || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.login !== "string" || typeof parsed.role !== "string") {
      return null;
    }
    return { login: parsed.login, role: parsed.role };
  } catch {
    return null;
  }
}

/** Проміжний обробник: пропускає лише запити з дійсним Bearer-токеном */
function requireAuth(req, res, next) {
  const header = req.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Потрібна автентифікація" });
  }
  const user = verifyToken(header.slice(7).trim());
  if (!user) return res.status(401).json({ error: "Потрібна автентифікація" });
  req.user = user;
  next();
}

/** Проміжний обробник перевірки ролі користувача (авторизація) */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Доступ заборонено" });
    }
    next();
  };
}

function login(db, loginName, password) {
  if (typeof loginName !== "string" || typeof password !== "string" || !loginName || !password) {
    return null;
  }
  const user = db.prepare("SELECT login, password_hash, role FROM users WHERE login = ?").get(loginName);
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  return createToken(user.login, user.role);
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  requireAuth,
  requireRole,
  login,
};
