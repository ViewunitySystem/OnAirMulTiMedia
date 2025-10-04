# Contributing

## Setup
- Node 20, pnpm oder npm
- Rust stable
- `cp .env.example .env` und Variablen setzen

## Branching & Commits
- Feature-Branches von `mainzero`
- Conventional Commits (`feat:`, `fix:`, `docs:`, ...)

## Tests
- JS/TS: `pnpm test:unit`, `pnpm test:e2e`
- Rust: `cargo test`

## PR-Checks
- Lint, Typecheck, Tests müssen grün sein