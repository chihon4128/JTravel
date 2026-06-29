(() => {
  const config = {
    cookieName: "bangkok_trip_access_v1",
    cookieValue: "granted_v1",
    storageKey: "bangkok_trip_access_v1",
    lastPageCookieName: "bangkok_trip_last_page_v1",
    lastPageStorageKey: "bangkok_trip_last_page_v1",
    maxAgeSeconds: 60 * 60 * 24 * 30,
    salt: "bangkok-trip-2026-v1",
    iterations: 210000,
    keyLength: 32,
    hashHex: "748d21906b11f83947db42760eb532d98dbdcfcf581e92095b664e086c830432"
  };

  const scriptElement = document.currentScript || Array.from(document.scripts).find((script) => /auth\.js(?:\?|$)/.test(script.src));
  const scriptUrl = scriptElement && scriptElement.src
    ? new URL(scriptElement.src, location.href)
    : new URL("auth.js", location.href);
  const baseUrl = new URL("./", scriptUrl);

  function getCookiePath() {
    return baseUrl.pathname.endsWith("/") ? baseUrl.pathname : `${baseUrl.pathname}/`;
  }

  function buildUrl(relativePath) {
    return new URL(relativePath, baseUrl).href;
  }

  function readCookie(name) {
    const cookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
  }

  function writeCookie(name, value, maxAgeSeconds) {
    const parts = [
      `${name}=${encodeURIComponent(value)}`,
      `Max-Age=${maxAgeSeconds}`,
      `Path=${getCookiePath()}`,
      "SameSite=Lax"
    ];

    if (location.protocol === "https:") {
      parts.push("Secure");
    }

    document.cookie = parts.join("; ");
  }

  function setPersistentAuth() {
    writeCookie(config.cookieName, config.cookieValue, config.maxAgeSeconds);

    try {
      localStorage.setItem(config.storageKey, config.cookieValue);
    } catch (error) {
      return;
    }
  }

  function clearPersistentAuth() {
    writeCookie(config.cookieName, "", 0);

    try {
      localStorage.removeItem(config.storageKey);
    } catch (error) {
      return;
    }
  }

  function hasPersistentAuth() {
    const cookieValue = readCookie(config.cookieName);

    if (cookieValue === config.cookieValue) {
      return true;
    }

    try {
      const storedValue = localStorage.getItem(config.storageKey);

      if (storedValue === config.cookieValue) {
        writeCookie(config.cookieName, config.cookieValue, config.maxAgeSeconds);
        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }

  function setRememberedPage(pageUrl) {
    const normalizedUrl = normalizeNextUrl(pageUrl, "index.html");
    writeCookie(config.lastPageCookieName, normalizedUrl, config.maxAgeSeconds);

    try {
      localStorage.setItem(config.lastPageStorageKey, normalizedUrl);
    } catch (error) {
      return;
    }
  }

  function getRememberedPage() {
    const cookieValue = readCookie(config.lastPageCookieName);

    if (cookieValue) {
      return normalizeNextUrl(cookieValue, "index.html");
    }

    try {
      const storedValue = localStorage.getItem(config.lastPageStorageKey);
      return storedValue ? normalizeNextUrl(storedValue, "index.html") : "";
    } catch (error) {
      return "";
    }
  }

  function clearRememberedPage() {
    writeCookie(config.lastPageCookieName, "", 0);

    try {
      localStorage.removeItem(config.lastPageStorageKey);
    } catch (error) {
      return;
    }
  }

  function rememberCurrentPage() {
    setRememberedPage(location.href);
  }

  async function derivePasswordHashHex(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(config.salt),
        iterations: config.iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      config.keyLength * 8
    );

    return Array.from(new Uint8Array(derivedBits))
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }

  async function verifyPassword(password) {
    const derived = await derivePasswordHashHex(password);
    return derived === config.hashHex;
  }

  function normalizeNextUrl(nextValue, fallbackRelativePath = "index.html") {
    if (!nextValue) {
      return buildUrl(fallbackRelativePath);
    }

    try {
      const resolved = new URL(nextValue, location.href);

      if (location.protocol !== "file:" && resolved.origin !== location.origin) {
        return buildUrl(fallbackRelativePath);
      }

      if (!resolved.pathname.startsWith(getCookiePath())) {
        return buildUrl(fallbackRelativePath);
      }

      return resolved.href;
    } catch (error) {
      return buildUrl(fallbackRelativePath);
    }
  }

  function requireAuth(loginRelativePath = "login.html") {
    if (hasPersistentAuth()) {
      return true;
    }

    const loginUrl = new URL(buildUrl(loginRelativePath));
    const currentUrl = new URL(location.href);
    loginUrl.searchParams.set("next", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    location.replace(loginUrl.href);
    return false;
  }

  function redirectAfterLogin(defaultRelativePath = "index.html") {
    const params = new URLSearchParams(location.search);
    const nextValue = params.get("next");
    location.replace(normalizeNextUrl(nextValue, defaultRelativePath));
  }

  function logout(redirectRelativePath = "login.html") {
    clearPersistentAuth();
    clearRememberedPage();
    location.replace(buildUrl(redirectRelativePath));
  }

  window.TripAuth = {
    baseUrl: baseUrl.href,
    buildUrl,
    getCookiePath,
    hasPersistentAuth,
    setPersistentAuth,
    clearPersistentAuth,
    setRememberedPage,
    getRememberedPage,
    clearRememberedPage,
    rememberCurrentPage,
    verifyPassword,
    requireAuth,
    redirectAfterLogin,
    logout
  };
})();
