<h1 align="center">read-only-reddit-old</h1>

<p align="center">
  A Claude Code skill, a small MCP server and a browser extension that let Claude search Reddit and read threads through old.reddit.com in your own browser, slowly. It only reads. MIT.
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
  <a href="https://github.com/Xdabier/read-only-reddit-old-claude-skill-chrome-extension/actions/workflows/ci.yml"><img src="https://github.com/Xdabier/read-only-reddit-old-claude-skill-chrome-extension/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Xdabier/read-only-reddit-old-claude-skill-chrome-extension/releases"><img src="https://img.shields.io/github/v/release/Xdabier/read-only-reddit-old-claude-skill-chrome-extension" alt="Latest release"></a>
  <a href="https://github.com/Xdabier/read-only-reddit-old-claude-skill-chrome-extension/commits"><img src="https://img.shields.io/github/last-commit/Xdabier/read-only-reddit-old-claude-skill-chrome-extension" alt="Last commit"></a>
  <img src="https://img.shields.io/badge/node-22%2B-339933.svg" alt="Node 22 or newer">
</p>

## Why

Reddit threads are often the best answer to "what do people who use this really think". Claude cannot open them on its own, so the usual routine is to open each thread yourself, copy it and paste it into the chat.

This project automates that routine and nothing more:

- Claude asks for a search or a thread.
- Your browser opens the old.reddit.com page in a background tab, like you would.
- The extension reads the text from the page and hands it back.

It cannot vote, post, comment, send messages or log in. It never clicks anything on the page.

## Features

- Search all of Reddit or one subreddit, with sort and time filters.
- Read a thread as a clean text tree: post, nested comments, scores, dates, OP markers and link targets.
- Read subreddit listings, user pages and "next page" links.
- Slow by design: 8 to 20 seconds between page loads, a longer break every 10 pages, and a 30 minute stop if Reddit shows a block page.
- Private pages are refused: inbox, settings, mod pages and submit forms.
- No runtime dependencies. The MCP server is plain Node, the extension is plain JavaScript with no build step.
- Works with several Claude Code sessions at once. They share one connection to the extension.

## Quickstart

You need Node 22 or newer, a Chromium browser (Chrome, Brave, Edge) and Claude Code.

1. Clone the repository into your Claude Code skills folder. The folder name must be `read-only-reddit-old`.

   ```bash
   git clone https://github.com/Xdabier/read-only-reddit-old-claude-skill-chrome-extension.git ~/.claude/skills/read-only-reddit-old
   ```

2. Load the extension.
   - Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`).
   - Turn on "Developer mode".
   - Click "Load unpacked" and pick the `extension` folder inside the clone.

3. Register the MCP server with Claude Code. Use the full path to your clone.

   ```bash
   claude mcp add --scope user read-only-reddit-old -- node ~/.claude/skills/read-only-reddit-old/mcp-server/src/index.js
   ```

   On Windows, write the path out, for example `C:\Users\you\.claude\skills\read-only-reddit-old\mcp-server\src\index.js`.

4. Start a new Claude Code session and ask for something like "search Reddit for the best self-hosted backup tools".

The extension can take up to 30 seconds to connect after Claude Code starts.

## Tools

The MCP server is named `read-only-reddit-old` and exposes four tools:

- `status`: checks that the extension is connected. Loads no Reddit page.
- `search`: takes `query`, and optionally `subreddit`, `sort`, `time` and `max_items`. Returns posts with their thread URLs.
- `read_thread`: takes a thread `url` from reddit.com or redd.it, and optionally `sort`, `comment_limit` and `max_comments`. Returns the post and its comment tree.
- `read_listing`: takes the `url` of a subreddit listing, a user page or a next page link.

`SKILL.md` tells Claude when to use them and how to keep the page count low.

The server speaks plain MCP over stdio, so other MCP clients can use it too. Only Claude Code is tested.

## How it works

```
Claude Code  <-- stdio (MCP) -->  mcp-server  <-- 127.0.0.1:47821 -->  extension  -->  old.reddit.com
```

- Claude calls a tool. The MCP server puts the request in a queue.
- The extension long-polls the server on `127.0.0.1:47821` and picks up one request at a time.
- It waits for its turn, loads the page in one reused background tab, reads the DOM and posts the result back.
- With several Claude Code sessions open, the first server owns the port and the others send through it. If the owner exits, another takes over.

## Repository layout

- `SKILL.md`: the Claude Code skill.
- `extension/`: the Manifest V3 browser extension.
  - `src/extractors/`: the functions that run inside the Reddit page.
  - `src/pacing.js` and `src/config.js`: the delays.
  - `src/urls.js`: the URL allowlist.
- `mcp-server/`: the MCP server.
  - `src/bridge/`: the local HTTP bridge to the extension.
  - `src/tools.js` and `src/format.js`: the tools and their text output.

## Pace

The delays live in `extension/src/config.js`:

- 8 to 20 seconds between page loads, picked at random.
- A 45 to 90 second break after every 10 pages.
- A 30 minute stop when Reddit shows a block or rate limit page.

A research task that reads one search page and five threads takes one to two minutes. The pace is meant to match one person reading.

## Security and privacy

- The bridge listens on `127.0.0.1` only. It checks the `Host` header and needs a custom header that web pages cannot send across origins.
- The extension only has access to `old.reddit.com` and the local bridge. It rewrites every URL to `old.reddit.com` and refuses paths outside public listings, searches, threads and user pages.
- Nothing is sent anywhere except from the extension to the local MCP server, and from there to your MCP client.
- Pages load in your normal browser profile. If you are logged in to Reddit, the extension sees what you would see.
- Thread text is written by strangers. The skill tells Claude to treat it as data and never as instructions.

To report a security problem, follow [SECURITY.md](SECURITY.md).

## Limits

- It never expands "load more comments". Those are reported as not loaded.
- Age gate, private and quarantined pages are reported, not passed.
- It reads the old Reddit layout only. If Reddit changes that markup, the selectors in `extension/src/extractors/` need an update.
- The browser must be running.

## Use it responsibly

- This project is not affiliated with, endorsed by or sponsored by Reddit or Anthropic.
- Automated access may be against the Reddit User Agreement. You are responsible for how you use this tool and for your own account.
- Keep usage personal and light. Do not lower the delays, and do not use it to collect Reddit content in bulk or to train models.

## Contributing, security and community

- [CONTRIBUTING.md](CONTRIBUTING.md): local setup, checks and how to send a change.
- [SECURITY.md](SECURITY.md): how to report a vulnerability in private.
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): how we treat each other.
- [CHANGELOG.md](CHANGELOG.md): what changed in each release.

## License

[MIT](LICENSE). Copyright (c) 2026 Badii Studio. See [NOTICE](NOTICE).
