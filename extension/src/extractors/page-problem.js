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
