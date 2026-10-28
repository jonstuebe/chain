# Chain

A word ladder game. Climb from the top word to the bottom word, one letter at a time.

- Each step changes exactly one letter and must be a real word.
- **Par** is the shortest possible chain. Match it for a perfect score.
- A green underline means that letter already matches the target.
- Tap any earlier word to climb back down to it. Undoing is free; hints add a step.

Example: COLD → CORD → WORD → WARD → WARM

## Agent skills

### Issue tracker

Issues live in GitHub Issues on `jonstuebe/chain` (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at the repo root (created lazily). See `docs/agents/domain.md`.
