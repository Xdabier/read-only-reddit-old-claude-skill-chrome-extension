import { LoginRequired } from './login-wall.js';

const LOGIN_NEEDED =
  'Reddit asked for a login on both old.reddit.com and www.reddit.com. Ask the user to log in to Reddit in this browser, then try again.';

const unlessLoginRequired = (error) => {
  if (!(error instanceof LoginRequired)) throw error;
};

// Old Reddit first. Only a login wall moves the request to new Reddit.
// Blocks, rate limits and every other error are passed on as they are.
export async function readWithFallback({ readOld, readNew, wall }) {
  if (!(await wall.isUp())) {
    try {
      return await readOld();
    } catch (error) {
      unlessLoginRequired(error);
      await wall.remember();
    }
  }
  try {
    return await readNew();
  } catch (error) {
    unlessLoginRequired(error);
    throw new Error(LOGIN_NEEDED, { cause: error });
  }
}
