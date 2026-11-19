import { LoginRequired } from './login-wall.js';

export const LAYOUT_CHOICES = ['auto', 'old', 'new'];

const unlessLoginRequired = (error) => {
  if (!(error instanceof LoginRequired)) throw error;
};

async function orAskForLogin(read, where) {
  try {
    return await read();
  } catch (error) {
    unlessLoginRequired(error);
    throw new Error(
      `Reddit asked for a login on ${where}. Ask the user to log in to Reddit in this browser, then try again.`,
      { cause: error },
    );
  }
}

// 'auto' reads old Reddit first, and only a login wall moves the request to
// new Reddit. 'old' and 'new' read one layout and never fall back.
// Blocks, rate limits and every other error are passed on as they are.
export async function readWithFallback({ readOld, readNew, wall, layout = 'auto' }) {
  if (!LAYOUT_CHOICES.includes(layout)) throw new Error(`Unknown layout: ${layout}`);
  if (layout === 'old') return orAskForLogin(readOld, 'old.reddit.com');
  if (layout === 'new') return orAskForLogin(readNew, 'www.reddit.com');

  if (!(await wall.isUp())) {
    try {
      return await readOld();
    } catch (error) {
      unlessLoginRequired(error);
      await wall.remember();
    }
  }
  const data = await orAskForLogin(readNew, 'both old.reddit.com and www.reddit.com');
  return { ...data, fell_back: true };
}
