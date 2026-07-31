# Git workflow

## Invariant

`main` is initialized once and then becomes read-only for agents.

Every later change uses a branch and pull request. Only Sergio merges from GitHub web.

## Branch names

`<type>/<kebab-case>`

Allowed types:

- feature
- bugfix
- fix
- update
- refactor
- security
- test
- docs
- chore
- release

## Commit messages

Conventional Commits:

`type(scope): description`

Tool attribution is prohibited.

## Stacked implementation

The autonomous recovery creates dependent branches from their predecessor, while every PR targets `main`.

Merge order is the recovery order.

While the stack is active:

1. Merge from oldest to newest.
2. Use **Create a merge commit**.
3. Do not squash the parent PR, because descendant branches contain its original commits.
4. Do not delete parent branches until descendants have been merged or rebased.
5. Re-check the next PR diff after each merge.

## Forbidden operations

- Direct push to main.
- Commit on main after bootstrap.
- Merge performed by an agent.
- `gh pr merge`.
- Force push.
- Remote branch deletion by an agent.
- History rewriting on shared branches.
