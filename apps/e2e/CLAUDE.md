Read ./README.md before changing this workspace.

- pnpm verify does NOT run these specs — a green verify says nothing about
  login working. They run against the full stack via compose (pnpm e2e:docker).
