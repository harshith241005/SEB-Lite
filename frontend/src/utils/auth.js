import CryptoJS from "crypto-js";

const STORAGE_KEY = "seb-lite-auth";
const LEGACY_KEYS = ["accessToken", "refreshToken", "token", "user"];

const deriveKey = () => {
  const platform = window.electronAPI?.getPlatform?.() || navigator.platform;
  return CryptoJS.SHA256(`${navigator.userAgent}|${platform}`).toString();
};

const readPayload = () => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) {
    return null;
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, deriveKey());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

const writePayload = (payload) => {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify({ ...payload, storedAt: Date.now() }),
    deriveKey()
  ).toString();
  localStorage.setItem(STORAGE_KEY, encrypted);
};

export const setAuthTokens = (accessToken, refreshToken, user) => {
  writePayload({ accessToken, refreshToken, user });
};

export const getAuthPayload = () => readPayload();

export const getAccessToken = () => {
  const payload = readPayload();
  if (payload?.accessToken) {
    return payload.accessToken;
  }
  return localStorage.getItem("token");
};

export const getRefreshToken = () => {
  const payload = readPayload();
  if (payload?.refreshToken) {
    return payload.refreshToken;
  }
  return localStorage.getItem("refreshToken");
};

export const getUser = () => {
  const payload = readPayload();
  if (payload?.user) {
    return payload.user;
  }
  const legacyUser = localStorage.getItem("user");
  return legacyUser ? JSON.parse(legacyUser) : null;
};

export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY);
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const isAuthenticated = () => !!getAccessToken();

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5001/api"}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    const payload = readPayload() || {};
    writePayload({ ...payload, accessToken: data.accessToken, refreshToken: data.refreshToken });

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    clearAuth();
    window.location.href = "/login";
    throw error;
  }
};

export const logout = async () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  try {
    if (accessToken) {
      await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5001/api"}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAuth();
  }
};
