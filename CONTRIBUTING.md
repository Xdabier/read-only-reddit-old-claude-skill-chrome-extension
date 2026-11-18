# Contributing

Thank you for helping. This page covers the local setup, the checks a change must pass, and how to send it.

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md). To report a security problem, follow [SECURITY.md](SECURITY.md) and do not open a public issue.

## Before you start

- Open an issue first for anything larger than a small fix, so the approach is agreed before you write code.
- Keep one goal per pull request. A refactor and a feature go in separate pull requests.
- The project is read only on purpose. A change that makes the extension click, vote, post, log in or read private pages will not be merged.
- A change that removes or shortens the delays will not be merged either.

## Local setup

You need Node 22 or newer (see `.nvmrc`), npm, Git and a Chromium browser.

```bash
npm install
npm run check
```

- The MCP server and the extension have no runtime dependencies and no build step. `npm install` only brings in ESLint and Prettier.
- To try the extension, load the `extension` folder as an unpacked extension. After a code change, press the reload button on the extensions page.
- To try the server by hand, run `npm start`. It speaks MCP over stdio.
- The server listens on `127.0.0.1:47821`. A Claude Code session with the server registered already uses that port, and a second server sends its requests through it.

## Checks

Run the gate before you push:

```bash
npm run check
```

It runs ESLint, the Prettier check and the unit tests. CI runs the same on every push and pull request, on Linux and Windows.

The extractors in `extension/src/extractors/` run inside a real Reddit page and have no automated test. If you change one:

- Save a search page and a thread page from old.reddit.com to your disk.
- Run the extractor on them in a browser and check the output by eye.
- Say in the pull request what you checked. Do not commit saved Reddit pages, they hold other people's content.

Do not change a lint rule or a test just to make a run pass. If a rule is wrong, say so in the pull request and change it in its own commit.

## Code style

- Files and directories in kebab-case.
- One concern per file. The URL allowlist, the pacing, the tab handling and the extractors each have their own module.
- Functions in `extension/src/extractors/` are injected into the page, so they must be self-contained. They cannot use imports or outer variables.
- Comment only what the code cannot say. Keep comments short.
- A bug fix starts with a test that fails without the fix, when the code is testable in Node.

## Commits

Commits follow the Angular convention:

```
type(scope): subject
```

- `type` is one of `build`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor` or `test`.
- `scope` is the area you touched, for example `extension`, `mcp-server`, `skill` or `github`.
- Write the subject in the imperative, lowercase, with no period at the end.
- Add a body that says why the change is needed. Only `docs` commits may skip it.
- Update `CHANGELOG.md` when users will notice the change.

## Pull requests

- Fill in the pull request template.
- Link the issue the change closes.
- Make sure `npm run check` passes and CI is green.
- If you used an AI tool, say so in the pull request. It is allowed.

## License of contributions

The project is published under the [MIT License](LICENSE). Contributions are accepted under the same license: by sending one you confirm that you wrote it or have the right to submit it, and you agree that it is distributed under the MIT License. No sign-off line or contributor agreement is needed.
