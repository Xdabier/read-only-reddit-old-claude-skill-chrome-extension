// Port must match mcp-server/src/bridge/http-server.js and manifest.json.
export const BRIDGE_URL = 'http://127.0.0.1:47821';
export const CLIENT_HEADER = { 'X-Roro-Client': 'extension' };

export const REDDIT_ORIGIN = 'https://old.reddit.com';
export const LOAD_TIMEOUT_MS = 45_000;

export const PACING = {
  minGapMs: 8_000,
  maxGapMs: 20_000,
  pagesPerBreak: 10,
  minBreakMs: 45_000,
  maxBreakMs: 90_000,
  blockCooldownMs: 30 * 60_000,
};
