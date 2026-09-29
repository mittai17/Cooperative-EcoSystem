# Domain seed migration

This is a registration skeleton, not a replacement dataset. Existing explicit
commands `python -m app.seed` and `python -m app.seed_mobile` remain unchanged.
No seed runs at import or API startup.

Each future domain module defines an idempotent `async def seed(db)` and
registers it with `app.seeds.register(domain, seed)`. The orchestration caller
imports those modules, then calls `await app.seeds.run(db)` and commits once.
`run()` returns the domains actually seeded; unimplemented domains are skipped.
Only use an explicitly supplied scratch-database session during development.
