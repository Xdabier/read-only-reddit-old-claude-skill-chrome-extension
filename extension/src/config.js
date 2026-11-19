// Port must match mcp-server/src/bridge/http-server.js and manifest.json.
export const BRIDGE_URL = 'http://127.0.0.1:47821';
export const CLIENT_HEADER = { 'X-Roro-Client': 'extension' };

// Both origins must be listed in manifest.json host_permissions.
export const OLD_REDDIT_ORIGIN = 'https://old.reddit.com';
export const NEW_REDDIT_ORIGIN = 'https://www.reddit.com';
export const LOAD_TIMEOUT_MS = 45_000;

// How long to skip old Reddit after it asked for a login.
export const LOGIN_WALL_MEMORY_MS = 60 * 60_000;

export const PACING = {
  minGapMs: 8_000,
  maxGapMs: 20_000,
  pagesPerBreak: 10,
  minBreakMs: 45_000,
  maxBreakMs: 90_000,
  blockCooldownMs: 30 * 60_000,
};
