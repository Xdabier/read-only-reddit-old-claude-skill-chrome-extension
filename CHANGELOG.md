# read-only-reddit-old

## 1.1.0

### Added

- Fallback to the new Reddit layout. When old Reddit asks for a login, the same page is read from www.reddit.com and the tool output starts with a note that says so. Old Reddit is then skipped for an hour.
- Extractors for new Reddit threads, search results and post feeds. They read what is in the page without a click, so they return fewer comments and results than old Reddit.
- A clear error when both layouts ask for a login, so Claude can ask you to log in.

### Changed

- The extension now asks for access to `www.reddit.com` as well as `old.reddit.com`. Reload it after updating.

## 1.0.0

First public release.

### Added

- Browser extension (Manifest V3) that loads old.reddit.com pages in one background tab and reads their text. It never clicks anything.
- MCP server with four tools: `status`, `search`, `read_thread` and `read_listing`. No runtime dependencies.
- Claude Code skill that tells Claude when to use the tools and how to keep the page count low.
- Slow pacing: 8 to 20 seconds between page loads, a 45 to 90 second break every 10 pages, and a 30 minute stop when Reddit shows a block page.
- URL allowlist that keeps the extension on public listings, searches, threads and user pages.
- Local bridge on `127.0.0.1:47821` that rejects requests from web pages and lets several Claude Code sessions share one extension.
