Read ./README.md before changing this workspace.

- client/, constants/, permissions/, types/ must stay Zod-free — frontends
  bundle them. Runtime values go in constants/, never in schema files.
  schemas/ is the only Zod-land.
- Watch import direction inside schemas/: a cycle evaluates a schema to
  undefined with no error until runtime. Shared pieces live in common.schema
  or constants/.
- A permission no route reads gets deleted from PERMISSIONS and
  ROLE_PERMISSIONS, not kept.
