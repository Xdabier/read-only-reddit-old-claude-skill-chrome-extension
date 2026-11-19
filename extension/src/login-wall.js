import { LOGIN_WALL_MEMORY_MS } from './config.js';

const WALL_KEY = 'oldRedditWallUntil';
const LOGIN_PATH = /^\/(?:login|register|account\/login)(?:\/|$)/;

export class LoginRequired extends Error {
  constructor() {
    super('Reddit asked for a login.');
  }
}

// A page that lands on a login path, or that was moved to another origin,
// was not served to this user.
export function assertServed(target, landedUrl) {
  if (!landedUrl) {
    throw new Error('Page redirected away from Reddit. Open the URL by hand to check it.');
  }
  const landed = new URL(landedUrl);
  if (landed.origin !== target.origin || LOGIN_PATH.test(landed.pathname)) {
    throw new LoginRequired();
  }
}

// Remembers that old Reddit asked for a login, so the next requests do not
// load two pages each.
export const oldRedditWall = {
  async isUp() {
    const { [WALL_KEY]: until = 0 } = await chrome.storage.local.get(WALL_KEY);
    return Date.now() < until;
  },
  remember: () => chrome.storage.local.set({ [WALL_KEY]: Date.now() + LOGIN_WALL_MEMORY_MS }),
};
