const FEWER = 'That layout shows fewer comments and results without a click.';
const FELL_BACK_NOTE = `Note: old Reddit asked for a login, so this was read from www.reddit.com instead. ${FEWER}`;
const REQUESTED_NOTE = `Note: read from www.reddit.com, as requested. ${FEWER}`;

const meta = (parts) => parts.filter(Boolean).join(' · ');
const user = (name) => (name.startsWith('[') ? name : `u/${name}`);
const day = (iso) => iso?.slice(0, 10);
const count = (value, unit) => (value === null || value === undefined ? null : `${value} ${unit}`);
const indent = (text, pad) =>
  text
    .split('\n')
    .map((line) => pad + line)
    .join('\n');

// Says so when the text comes from the new Reddit layout, and why.
function withLayoutNote({ layout, fell_back: fellBack }, text) {
  if (layout !== 'new') return text;
  return `${fellBack ? FELL_BACK_NOTE : REQUESTED_NOTE}\n\n${text}`;
}

function formatItem(item, index) {
  const facts = meta([
    item.subreddit && `r/${item.subreddit}`,
    user(item.author),
    count(item.score, 'points'),
    count(item.comments, 'comments'),
    day(item.created),
    item.flair && `flair: ${item.flair}`,
  ]);
  return [
    `${index + 1}. ${item.title}`,
    `   ${facts}`,
    `   ${item.url}`,
    item.snippet && `   ${item.snippet}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function nextPageLine(layout, next) {
  if (next) return `Next page (use read_listing): ${next}`;
  return layout === 'new' ? 'More results load on scroll and were not read.' : 'No more pages.';
}

export function formatListing(data) {
  const { page_title: title, url, items, next_url: next, layout } = data;
  if (!items.length) return withLayoutNote(data, `No posts found at ${url}`);
  const text = [
    `${title}\n${url}`,
    items.map(formatItem).join('\n\n'),
    nextPageLine(layout, next),
  ].join('\n\n');
  return withLayoutNote(data, text);
}

function formatComment(comment) {
  const pad = '  '.repeat(comment.depth);
  if (comment.more) return `${pad}[not loaded: ${comment.more}]`;
  if (comment.continue_url)
    return `${pad}[thread continues, use read_thread: ${comment.continue_url}]`;

  const head = meta([
    `${user(comment.author)}${comment.op ? ' (OP)' : ''}`,
    count(comment.score, 'points'),
    day(comment.created),
    comment.stickied && 'stickied',
  ]);
  return `${pad}[${head}]\n${indent(comment.text || '(no text)', pad)}`;
}

export function formatThread(data) {
  const { post, comments, truncated } = data;
  const facts = meta([
    post.subreddit && `r/${post.subreddit}`,
    user(post.author),
    count(post.score, 'points'),
    count(post.comment_count, 'comments'),
    day(post.created),
    post.flair && `flair: ${post.flair}`,
  ]);
  const shown = comments.filter((comment) => comment.text !== undefined).length;

  const text = [
    `# ${post.title}\n${facts}\n${post.url}`,
    post.link && `Links to: ${post.link}`,
    post.text,
    `## Comments (${shown} shown${truncated ? ', cut at the max_comments limit' : ''})`,
    comments.map(formatComment).join('\n\n') || '(no comments)',
  ]
    .filter(Boolean)
    .join('\n\n');
  return withLayoutNote(data, text);
}
