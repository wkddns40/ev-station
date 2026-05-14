<!--
This template is auto-applied to every PR opened against this repository.
Fill every section. Reviewer audience: the same developer six months from now with no memory of this work.
Reference: REFACTOR_PLAN.md §14 (PR Workflow).
-->

## Phase N — <short title>

### What changed
<!-- File-level diff narrative. 5-10 bullets. Describe concrete edits, not motivation. -->
-
-

### Why (architecture decisions)
<!-- Link locked decisions from REFACTOR_PLAN.md §12. -->
- D? (<title>) — <how this PR honors / applies it>

### Rejected alternatives
<!-- What you considered and discarded, with the reason. Prevents future-you from re-litigating. -->
- Considered <X>; rejected because <Y>.

### Atomic tasks completed
<!-- Every task ID from the phase's atomic table. -->
- T<N>.<n>, T<N>.<n>, ...
- See `REFACTOR_PLAN.md` §<section> for full definition of each.

### Verification (Phase N gate)
- [ ] All Verification checkboxes in §<section> Verification subsection pass
- [ ] Self-review pass on "Files changed" tab against §14 checklist
- [ ] `git log --format='%an <%ae>'` shows `wkddns40 <wkddns40@gmail.com>` for every new commit (D9)
- [ ] Every commit shows "Verified" badge (D11)
- [ ] PR diff size within budget per §14 PR size budget table (Phase 2c exempt)
- [ ] CHANGELOG.md updated under `## [Unreleased]` (rule 15d)
- [ ] CI green (Phase 4+)

### Future-self notes
<!-- Gotchas, non-obvious decisions, deferred tech debt, migration deps for the next phase. -->
-

### Screenshots / GIF (UI changes only)
<!-- Embed before/after if rendered output changes. Same viewport, same filter state. Skip if no UI change. -->

---

Closes #<Issue>
