// Runs inside the page, so it must stay self-contained.
export function findPageProblem() {
  const title = document.title.toLowerCase();
  const body = (document.body?.innerText ?? '').slice(0, 3000).toLowerCase();

  const blocked =
    title.includes('too many requests') ||
    title === 'blocked' ||
    body.includes('whoa there, pardner') ||
    body.includes('blocked by network security');
  if (blocked) {
    return {
      kind: 'blocked',
      message: 'Reddit blocked or rate limited this request. Stop reading Reddit for now.',
    };
  }

  // A password field with no posts, comments or results around it is a login wall.
  const content =
    '#siteTable, .commentarea, .search-result-listing, #noresults, shreddit-post, shreddit-feed, [data-testid="search-post-unit"]';
  const loginWall =
    /^\/(?:login|register)(?:\/|$)/.test(location.pathname) ||
    (document.querySelector('input[type="password"]') && !document.querySelector(content));
  if (loginWall) {
    return { kind: 'login', message: 'Reddit asked for a login.' };
  }

  if (title.includes('page not found')) {
    return { kind: 'missing', message: `Page not found: ${location.href}` };
  }

  const gate = document.querySelector('.interstitial');
  if (gate) {
    const reason = gate.querySelector('.interstitial-message')?.innerText.trim().split('\n')[0];
    return {
      kind: 'gate',
      message: `Reddit shows a gate page (${reason || 'age check, private or quarantined'}). The user has to open ${location.href} by hand first.`,
    };
  }
  return null;
}
