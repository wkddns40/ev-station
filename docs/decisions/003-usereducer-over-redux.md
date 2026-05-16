# ADR 003 — useReducer + Context over Redux

## Status

Accepted (2026-05-15). Implemented in Phase 2e. Locked under REFACTOR_PLAN.md §12 D3.

## Context

Legacy state: 30+ `useState` hooks in a single component, plus three sync `useEffect` hooks that copied filter values between two parallel state shapes ("source of truth" and "selectedFilters" object). Filter changes silently dropped results when the `if/else` cascade hit an unreachable branch (regression B3). Adding a new filter field required updating four call sites.

Requirements for the new state layer:

- One reducer, one action union, every dispatch typed at the call site.
- Filter selector memoized so layer recreation only happens on dep change.
- No top-level state library if the state graph is one shape (filters).

## Decision

Replace the `useState` swarm with a single `useReducer` returning a `FilterState` object, wrap it in `FiltersContext`, expose via a `useFilters()` hook that throws on missing provider.

```typescript
const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(filtersReducer, defaultFilterState);
  return <FiltersContext.Provider value={{ state, dispatch }}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (ctx === null) throw new Error('useFilters must be used inside a <FiltersProvider>');
  return ctx;
}
```

Reducer ends in `_exhaustive: never` so an unhandled action is a compile error.

## Consequences

**Positive**

- Filter state is one object, one source of truth. The three sync `useEffect`s are gone — filter changes are atomic.
- Action union + `_exhaustive: never` gives compile-time exhaustiveness. Adding a new field means adding both the `FilterState` member and a `SET_*` action, with the compiler refusing to let either slip.
- `useFilteredChargers` keys its `useMemo` on individual filter fields, NOT the whole `filters` object. A `TOGGLE_SORT_ORDER` dispatch doesn't invalidate the filter memo (so deck.gl layers don't rebuild), but the result list re-renders in the side pane.
- Test surface is plain functions: 11 unit tests on `filtersReducer.ts` + 3 on `FiltersContext.tsx`. No Redux DevTools setup, no middleware mock.
- Zero new runtime deps.

**Negative**

- No time-travel debugging. Redux DevTools is genuinely useful for complex flows; we don't have it.
- Context re-renders all consumers when state changes. With our consumer count (3 panes + map shell) this is non-issue; would matter if the consumer fan-out grew 10×.
- The `useFilters() throws on missing provider` pattern means rendering a consumer in a test requires the provider wrapper. `FiltersContext.test.tsx` documents both branches.

## Alternatives considered

- **Redux Toolkit.** Rejected for ceremony. RTK slice + store config + provider + selector hook for a state graph that's one object is more setup than the thing being set up. Right tool if the state graph grew to multiple slices with cross-slice middleware (notifications, undo/redo, optimistic updates) — none of which we have.
- **Zustand.** Considered. Strict pattern equivalent to `useReducer` + Context but with persisted state, devtools, and middleware out of the box. The wins are real for larger apps; for one filter object the React-native primitives are cleaner.
- **Jotai / Recoil (atomic state).** Rejected. Atomic state shines when state has many independent producers and consumers; our filter state is one object with one consumer flow.
- **Keep `useState` swarm.** Rejected. That's the bug source the refactor was designed to eliminate.

## Notes

- `APPLY_PARTIAL` action listed in the plan was never implemented — no call site needs atomic multi-field updates that `RESET` + individual `SET_*` can't express. Add only on demand.
- `sortOrder` and `filterStep` live inside `FilterState`. They aren't strictly "filters" but they share the reducer to keep state consolidated. Memo deps on `useFilteredChargers` exclude them so sort/step changes don't invalidate the filter result.
