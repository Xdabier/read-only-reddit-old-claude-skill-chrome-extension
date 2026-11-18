# Security policy

## Supported versions

Security fixes land on the latest release only. Update to the newest release before you report, if you can.

## Reporting a vulnerability

Please do not open a public issue, pull request or discussion for a security problem.

- Preferred: open a private report through GitHub at https://github.com/Xdabier/read-only-reddit-old-claude-skill-chrome-extension/security/advisories/new.
- Fallback: email badii@badii.studio with the subject line `SECURITY: <short summary>`.

Include what you can of the following:

- The affected part (extension, MCP server or skill) and the release or commit.
- The steps to reproduce, or a proof of concept against your own machine.
- The impact you observed or expect.

Problems we want to hear about include:

- A web page or another program that can send commands to the local bridge or read its results.
- A way to make the extension load a page outside old.reddit.com, or a private Reddit page such as the inbox or settings.
- A way to make the extension click, post, vote or change anything on Reddit.

Test only on your own machine and your own Reddit account. Do not run denial-of-service or social-engineering tests.

## What happens next

- We confirm receipt within five working days.
- We investigate, agree on a severity with you, and keep you updated while we work on a fix.
- We publish a fixed release and a GitHub security advisory. We credit you in the advisory unless you ask us not to.

Please give us a reasonable time to ship a fix before you disclose the problem publicly. We aim for 90 days or less.
