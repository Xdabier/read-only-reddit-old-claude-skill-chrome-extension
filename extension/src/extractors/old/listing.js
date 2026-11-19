// Runs inside the page, so it must stay self-contained.
// Handles search result pages and normal listings (subreddit, user, front page).
export function extractListing(maxItems) {
  const SNIPPET_LENGTH = 300;

  const num = (text) => {
    const match = /-?[\d,]+/.exec(text ?? '');
    return match ? Number(match[0].replace(/,/g, '')) : null;
  };
  const abs = (href) => (href ? new URL(href, location.origin).href : null);
  const clean = (text) => (text ?? '').replace(/\s+/g, ' ').trim();

  const fromSearchResult = (el) => ({
    title: clean(el.querySelector('a.search-title')?.textContent),
    url: abs(
      (el.querySelector('a.search-comments') ?? el.querySelector('a.search-title'))?.getAttribute(
        'href',
      ),
    ),
    subreddit:
      clean(el.querySelector('a.search-subreddit-link')?.textContent).replace(/^\/?r\//, '') ||
      null,
    author: clean(el.querySelector('.search-author .author')?.textContent) || '[deleted]',
    score: num(el.querySelector('.search-score')?.textContent),
    comments: num(el.querySelector('a.search-comments')?.textContent),
    created: el.querySelector('.search-time time')?.dateTime || null,
    flair: clean(el.querySelector('.linkflairlabel')?.textContent) || null,
    snippet:
      clean(el.querySelector('.search-result-body')?.textContent).slice(0, SNIPPET_LENGTH) || null,
  });

  const fromThing = (el) => ({
    title: clean(el.querySelector('a.title')?.textContent),
    url: abs(el.dataset.permalink),
    subreddit: el.dataset.subreddit ?? null,
    author: el.dataset.author ?? '[deleted]',
    score: num(el.dataset.score),
    comments: num(el.dataset.commentsCount),
    created: el.dataset.timestamp ? new Date(Number(el.dataset.timestamp)).toISOString() : null,
    flair: clean(el.querySelector('.linkflairlabel')?.textContent) || null,
    snippet: null,
  });

  const searchResults = [...document.querySelectorAll('.search-result-link')];
  const items = searchResults.length
    ? searchResults.map(fromSearchResult)
    : [...document.querySelectorAll('#siteTable > .thing.link:not(.promoted)')].map(fromThing);

  return {
    page_title: document.title,
    url: location.href,
    items: items.filter((item) => item.url).slice(0, maxItems),
    next_url: document.querySelector('.nav-buttons a[rel~="next"]')?.href ?? null,
  };
}
