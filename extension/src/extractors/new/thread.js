// Runs inside the page, so it must stay self-contained.
// Reads the current Reddit layout (www.reddit.com). Only what is in the page
// without a click is read, so long threads come back shorter than on old Reddit.
export function extractNewThread(maxComments) {
  const MORE_REPLIES = 'faceplate-partial[src*="more-comments"]';

  const num = (value) => (value === null || value === '' || isNaN(value) ? null : Number(value));
  const clean = (text) => (text ?? '').replace(/\s+/g, ' ').trim();

  // innerText drops link targets, so write them next to the label first.
  // This only changes the local copy of the page in the reader tab.
  const bodyText = (el) => {
    if (!el) return '';
    for (const a of el.querySelectorAll('a[href]')) {
      const label = a.textContent.trim();
      const isPlain =
        !a.href.startsWith('http') || a.href.includes(label) || /^\/?[ur]\//.test(label);
      if (!isPlain) a.textContent = `${label} (${a.href})`;
    }
    return el.innerText.trim();
  };

  const postEl = document.querySelector('shreddit-post');
  if (!postEl) return null;

  const attr = (el, name) => el.getAttribute(name);
  const body = postEl.querySelector('[slot="text-body"]');
  const post = {
    title: attr(postEl, 'post-title') ?? clean(postEl.querySelector('[slot="title"]')?.textContent),
    url: new URL(attr(postEl, 'permalink') ?? location.pathname, location.origin).href,
    link: attr(postEl, 'domain')?.startsWith('self.') ? null : attr(postEl, 'content-href'),
    subreddit: attr(postEl, 'subreddit-name'),
    author: attr(postEl, 'author') ?? '[deleted]',
    score: num(attr(postEl, 'score')),
    comment_count: num(attr(postEl, 'comment-count')),
    created: attr(postEl, 'created-timestamp'),
    flair: clean(postEl.querySelector('[slot="post-flair"]')?.textContent) || null,
    text: bodyText(body?.querySelector('.md') ?? body),
  };

  const ownBody = (commentEl) =>
    [...commentEl.querySelectorAll('[slot="comment"]')].find(
      (el) => el.closest('shreddit-comment') === commentEl,
    );

  const comments = [];
  let commentCount = 0;
  let truncated = false;

  // Replies are nested inside their parent, so document order is tree order.
  for (const el of document.querySelectorAll(`shreddit-comment, ${MORE_REPLIES}`)) {
    if (el.tagName !== 'SHREDDIT-COMMENT') {
      const parent = el.parentElement.closest('shreddit-comment');
      comments.push({
        depth: parent ? Number(attr(parent, 'depth')) + 1 : 0,
        more: clean(el.innerText) || 'more replies',
      });
      continue;
    }
    if (commentCount >= maxComments) {
      truncated = true;
      break;
    }
    commentCount += 1;
    comments.push({
      depth: Number(attr(el, 'depth')) || 0,
      author: attr(el, 'author') ?? '[deleted]',
      op: el.hasAttribute('is-op'),
      stickied: false,
      score: num(attr(el, 'score')),
      created: attr(el, 'created'),
      text: bodyText(ownBody(el)),
    });
  }

  return { post, comments, truncated };
}
