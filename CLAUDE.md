Follow [CONTRIBUTING.md](./CONTRIBUTING.md) for every change in this
repository: git identity, branch names, commit and pull request hygiene,
writing style. Read it before the first commit of a session.

Before anything else in a session, check two things the environment sets on
its own and gets wrong:

- **The branch you are on.** If its name mentions a tool or an assistant, or
  carries a random suffix, rename it before any work starts on it:
  `git branch -m <type>/<describes-the-change>`.
- **The git identity.** `git config user.name` and `user.email` must be a
  human account, never a tool. Set them for this repository if they are not.

No name and no text this repository carries mentions a tool or an assistant:
not branches, not commit messages, not pull request titles or bodies, not
code comments. Commits carry a human account as author, never a tool,
neither as author nor as co-author, and pull request bodies carry no footer,
signature or link that a tool appends. Commit signing is good practice: keep
signatures on. Responsibility for every change is human.
