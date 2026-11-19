// Runs inside the page, so it must stay self-contained.
// Reads search results and post feeds from the current Reddit layout
// (www.reddit.com). More results load on scroll there, so there is no next page.
export function extractNewListing(maxItems) {
  const num = (value) => (value === null || value === '' || isNaN(value) ? null : Number(value));
  const abs = (href) => (href ? new URL(href, location.origin).href : null);
  const clean = (text) => (text ?? '').replace(/\s+/g, ' ').trim();

  // Search results carry author and subreddit in a JSON attribute.
  const trackingContext = (el) => {
    const holder =
      el.closest('search-telemetry-tracker') ?? el.querySelector('search-telemetry-tracker');
    try {
      return JSON.parse(holder?.getAttribute('data-faceplate-tracking-context') ?? '{}');
    } catch {
      return {};
    }
  };

  const fromSearchUnit = (el) => {
    const title = el.querySelector('a[data-testid="post-title-text"], a[data-testid="post-title"]');
    const counters = el.querySelectorAll('[data-testid="search-counter-row"] faceplate-number');
    const info = trackingContext(el);
    return {
      title: clean(title?.textContent) || (info.post?.title ?? ''),
      url: abs(title?.getAttribute('href')),
      subreddit: info.subreddit?.name ?? null,
      author: info.profile?.name ?? '[deleted]',
      score: num(counters[0]?.getAttribute('number') ?? null),
      comments: num(counters[1]?.getAttribute('number') ?? null),
      created: el.querySelector('faceplate-timeago')?.getAttribute('ts') ?? null,
      flair: null,
      snippet: null,
    };
  };

  const fromPost = (el) => ({
    title: el.getAttribute('post-title') ?? '',
    url: abs(el.getAttribute('permalink')),
    subreddit: el.getAttribute('subreddit-name'),
    author: el.getAttribute('author') ?? '[deleted]',
    score: num(el.getAttribute('score')),
    comments: num(el.getAttribute('comment-count')),
    created: el.getAttribute('created-timestamp'),
    flair: clean(el.querySelector('[slot="post-flair"]')?.textContent) || null,
    snippet: null,
  });

  const searchUnits = [...document.querySelectorAll('[data-testid="search-post-unit"]')];
  const items = searchUnits.length
    ? searchUnits.map(fromSearchUnit)
    : [...document.querySelectorAll('shreddit-post')].map(fromPost);

  return {
    page_title: document.title,
    url: location.href,
    items: items.filter((item) => item.url).slice(0, maxItems),
    next_url: null,
  };
}
