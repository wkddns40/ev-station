# ADR 004 — TanStack Query for data fetching

## Status

Accepted (2026-05-15). Implemented in Phase 2f. Locked under REFACTOR_PLAN.md §12 D4.

## Context

Legacy data fetching: bare `useEffect(() => { fetch(...).then(setState) }, [])` with hand-rolled loading flags, no retry, no cache, no dedup. Symptoms in production:

- Every full reload re-fetched everything from the backend regardless of recency.
- React Strict Mode's double-mount fired the effect twice on first render, producing two requests every load in development.
- A tab refocus could trigger an unwanted refetch because the `useEffect` deps array was wrong.
- Error states were squashed into a single boolean; the actual error message never reached the UI.

We needed: a fetch primitive that gives us caching + loading state + retry + dedup, *without* implying a server-state architecture (Apollo, SWR's full ecosystem, RTK Query) that would dictate other choices.

## Decision

Use **TanStack Query 5** (`@tanstack/react-query`) with a module-scoped `QueryClient` in `main.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
```

The single `useChargerData` hook wraps `useQuery({ queryKey: ['chargers'], queryFn: fetchChargers })` and returns `{ data, manufacturers, voltTypes, efficiencyValues, isLoading, isError, error }`.

The fetch URL is computed once at module load (`DATA_URL = VITE_DEMO_MODE ? '/sample-chargers.json' : VITE_API_BASE_URL + '/charger'`) so the demo-mode toggle isn't re-evaluated per render.

## Consequences

**Positive**

- One source of truth for "are we loading", "did we error", "what's the data". No more loading flag drift.
- `staleTime: 60_000` matches the Flask `Cache(timeout=60)` decorator on the backend — frontend and backend cache windows align on purpose.
- `retry: 1` covers transient errors (network blip on a slow connection) without retry-storm risk.
- `refetchOnWindowFocus: false` — chargers aren't real-time data; refetching on tab focus would surprise users without giving them new information. Worth turning back on if a "live mode" stretch goal lands.
- React Strict Mode's double-mount is fine: Query dedups in-flight requests by key.

**Negative**

- One more dependency (~12 KB gzip). Lives in its own vendor chunk (`query-*.js`) so it doesn't co-invalidate with the app code.
- Devtools (`@tanstack/react-query-devtools`) are NOT bundled — the dashboard hook surface is small enough that the devtools weight isn't worth shipping. Reconsider if the query graph grows past 3–4 hooks.
- `queryFn` throws on non-OK responses by design. Components have to render the error state explicitly (currently the map just renders an empty layer set on error — acceptable for the demo; a real production UI would show a toast).

## Alternatives considered

- **Keep bare `useEffect` + `useState`.** Rejected — that's the legacy pattern we're moving away from. The bug surface is too wide.
- **SWR.** Considered. Smaller bundle (~5 KB gzip) and almost identical API for what we need. Picked TanStack because: (a) better TypeScript inference on the `data` field given our discriminated `ChargerCollection` type, (b) the `QueryClient` defaults are config in one place rather than a per-hook concern, (c) if a stretch goal pulls in mutations / optimistic updates, TanStack has a clearer story.
- **Apollo / urql.** Rejected — GraphQL infrastructure for a single REST endpoint is upside-down.
- **RTK Query.** Rejected. Coupled to a Redux store we're not running ([ADR 003](003-usereducer-over-redux.md)). Bundling Redux just to bundle RTK Query is a non-starter.

## Future considerations

- **Mutations** (charger ratings, favorites, etc.) — TanStack's `useMutation` slots in cleanly when those features arrive.
- **Real-time** — if Phase 6a (WebSocket) lands, Query supports a subscription pattern via `queryClient.setQueryData(['chargers'], newData)` on message receive. The hook surface doesn't change.
- **Suspense mode** — `useSuspenseQuery` could replace the explicit `isLoading` branch. Held until React 19 is the floor for the codebase.
