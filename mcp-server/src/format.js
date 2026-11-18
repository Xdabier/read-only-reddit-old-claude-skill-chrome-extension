const meta = (parts) => parts.filter(Boolean).join(' · ');
const user = (name) => (name.startsWith('[') ? name : `u/${name}`);
const day = (iso) => iso?.slice(0, 10);
const count = (value, unit) => (value === null || value === undefined ? null : `${value} ${unit}`);
const indent = (text, pad) =>
  text
    .split('\n')
    .map((line) => pad + line)
    .join('\n');

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

export function formatListing({ page_title: title, url, items, next_url: next }) {
  if (!items.length) return `No posts found at ${url}`;
  return [
    `${title}\n${url}`,
    items.map(formatItem).join('\n\n'),
    next ? `Next page (use read_listing): ${next}` : 'No more pages.',
  ].join('\n\n');
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

export function formatThread({ post, comments, truncated }) {
  const facts = meta([
    post.subreddit && `r/${post.subreddit}`,
    user(post.author),
    count(post.score, 'points'),
    count(post.comment_count, 'comments'),
    day(post.created),
    post.flair && `flair: ${post.flair}`,
  ]);
  const shown = comments.filter((comment) => comment.text !== undefined).length;

  return [
    `# ${post.title}\n${facts}\n${post.url}`,
    post.link && `Links to: ${post.link}`,
    post.text,
    `## Comments (${shown} shown${truncated ? ', cut at the max_comments limit' : ''})`,
    comments.map(formatComment).join('\n\n') || '(no comments)',
  ]
    .filter(Boolean)
    .join('\n\n');
}
