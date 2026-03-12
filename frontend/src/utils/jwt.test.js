import { describe, expect, it } from 'vitest';
import { decodeJwtPayload, getJwtExpiryMs, isTokenExpired } from './jwt';

function makeToken(payload) {
  const encoded = btoa(JSON.stringify(payload));
  return `x.${encoded}.y`;
}

describe('jwt utils', () => {
  it('decodes payload from token', () => {
    const token = makeToken({ userId: '123', role: 'ENGINEER' });
    expect(decodeJwtPayload(token)).toEqual({ userId: '123', role: 'ENGINEER' });
  });

  it('returns null for malformed token', () => {
    expect(decodeJwtPayload('bad.token')).toBeNull();
  });

  it('returns expiry time in ms', () => {
    const token = makeToken({ exp: 100 });
    expect(getJwtExpiryMs(token)).toBe(100000);
  });

  it('detects expired and non-expired tokens', () => {
    const expired = makeToken({ exp: Math.floor(Date.now() / 1000) - 10 });
    const active = makeToken({ exp: Math.floor(Date.now() / 1000) + 60 });

    expect(isTokenExpired(expired)).toBe(true);
    expect(isTokenExpired(active)).toBe(false);
  });
});
