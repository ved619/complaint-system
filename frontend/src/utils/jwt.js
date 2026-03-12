export function decodeJwtPayload(token) {
  if (!token) {
    return null;
  }

  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token) {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return null;
  }

  return payload.exp * 1000;
}

export function isTokenExpired(token) {
  const expiryMs = getJwtExpiryMs(token);

  if (!expiryMs) {
    return false;
  }

  return Date.now() >= expiryMs;
}
