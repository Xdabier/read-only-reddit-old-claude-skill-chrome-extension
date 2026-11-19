// Runs inside the page, so it must stay self-contained.
export function extractThread(maxComments) {
  const num = (text) => {
    const match = /-?[\d,]+/.exec(text ?? '');
    return match ? Number(match[0].replace(/,/g, '')) : null;
  };
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

  const postEl = document.querySelector('#siteTable .thing.link');
  if (!postEl) return null;

  const data = postEl.dataset;
  const post = {
    title: clean(postEl.querySelector('a.title')?.textContent),
    url: new URL(data.permalink ?? location.pathname, location.origin).href,
    link: data.domain?.startsWith('self.') ? null : (data.url ?? null),
    subreddit: data.subreddit ?? null,
    author: data.author ?? '[deleted]',
    score: num(data.score),
    comment_count: num(data.commentsCount),
    created: data.timestamp ? new Date(Number(data.timestamp)).toISOString() : null,
    flair: clean(postEl.querySelector('.linkflairlabel')?.textContent) || null,
    text: bodyText(postEl.querySelector('.usertext-body .md')),
  };

  const comments = [];
  let commentCount = 0;
  let truncated = false;

  const readComment = (el, depth) => {
    const entry = el.querySelector(':scope > .entry');
    const score = entry?.querySelector('.tagline .score.unvoted');
    return {
      depth,
      author: el.dataset.author ?? '[deleted]',
      op: Boolean(entry?.querySelector('.tagline .submitter')),
      stickied: el.classList.contains('stickied'),
      score: num(score?.title || score?.textContent),
      created: entry?.querySelector('.tagline time')?.dateTime || null,
      text: bodyText(entry?.querySelector('.usertext-body .md')),
    };
  };

  const walk = (table, depth) => {
    for (const el of table.querySelectorAll(':scope > .thing')) {
      if (truncated) return;
      if (el.classList.contains('morechildren')) {
        comments.push({
          depth,
          more: clean(el.querySelector('a')?.textContent) || 'more comments',
        });
      } else if (el.classList.contains('morerecursion')) {
        comments.push({ depth, continue_url: el.querySelector('a')?.href ?? null });
      } else if (el.classList.contains('comment')) {
        if (commentCount >= maxComments) {
          truncated = true;
          return;
        }
        commentCount += 1;
        comments.push(readComment(el, depth));
        const replies = el.querySelector(':scope > .child > .sitetable');
        if (replies) walk(replies, depth + 1);
      }
    }
  };

  const root = document.querySelector('.commentarea > .sitetable');
  if (root) walk(root, 0);

  return { post, comments, truncated };
}
