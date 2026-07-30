Read ./README.md before changing this workspace.

- A new key means: add it under keys/ AND translate it in every language file
  (en, es, lt). A test enforces this — nine keys once shipped untranslated and
  rendered raw paths to users.
- Errors across the repo reference keys as k.* — removing a key requires
  removing its call sites first.
