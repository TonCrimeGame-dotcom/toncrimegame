/* ===================================================
   TONCRIME ANTI CHEAT ENGINE
=================================================== */

GAME.security = {
  lastAction: 0,
  actionCount: 0,
  sessionToken: null
};

/* ================= TOKEN ================= */

function generateSessionToken() {

  const raw =
    CONFIG.USER_ID +
    navigator.userAgent +
    Date.now();

  GAME.security.sessionToken =
    btoa(raw).replace(/=/g, "");

  return GAME.security.sessionToken;
}

/* ================= SPAM PROTECT ================= */

function antiSpamCheck() {

  const now = Date.now();

  if (now - GAME.security.lastAction < 800) {
    GAME.security.actionCount++;
  } else {
    GAME.security.actionCount = 0;
  }

  GAME.security.lastAction = now;

  if (GAME.security.actionCount > 5) {
    console.warn("Spam detected");
    return false;
  }

  return true;
}

/* ================= SCORE HASH ================= */

async function createScoreHash(score) {

  const encoder = new TextEncoder();

  const data = encoder.encode(
    score +
    CONFIG.USER_ID +
    GAME.security.sessionToken
  );

  const hashBuffer =
    await crypto.subtle.digest("SHA-256", data);

  const hashArray =
    Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ================= VERIFY ACTION ================= */

function secureAction() {

  if (!antiSpamCheck())
    throw "AntiCheat: Spam blocked";

  if (!GAME.security.sessionToken)
    generateSessionToken();
}
