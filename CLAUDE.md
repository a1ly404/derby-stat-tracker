# CLAUDE.md

This file provides guidance to Claude Code when working in the `derby-stat-tracker` project.

## Project overview

TypeScript/React monorepo (npm workspaces) for tracking roller derby statistics. Connects to the `derby-scoreboard-api` REST proxy for live game data from a CRG ScoreBoard.

## Workspaces

| Package | Path | Purpose |
|---|---|---|
| `@derby/web` | `apps/web` | React + Vite main web app |
| `@derby/live-tracker` | `apps/live-tracker` | React + Vite + Tailwind v4 live scoreboard tracker |
| `@derby/live-frontend` | `packages/live-frontend` | Shared React components |
| `@derby/live-bridge` | `services/live-bridge` | Node.js background poller → Supabase persistence |

## Running

```sh
npm run dev              # Start apps/web (port 5173)
npm run tracker:dev      # Start apps/live-tracker (port 5175)
npm run bridge:dev       # Start services/live-bridge
npm run test             # Unit tests (apps/web)
npm run test:all         # Unit tests across all workspaces
npm run e2e              # Playwright E2E tests
```

## API type contract rules

### `derby-scoreboard-api/models.py` is the single source of truth

The file `apps/live-tracker/src/types/scoreboard-api.ts` is **auto-generated** from the OpenAPI spec that `derby-scoreboard-api` produces from its Pydantic models.

**Rules:**

1. **Never hand-edit** `apps/live-tracker/src/types/scoreboard-api.ts`. It will be overwritten by the sync script.
2. **To regenerate** after an API model change:
   ```sh
   npm run sync:api-types
   ```
   This fetches `http://localhost:5001/openapi.json` and writes the TypeScript interfaces. The scoreboard API must be running.
3. **When consuming API data**, always import types from `./types/scoreboard-api`, never define inline interfaces that duplicate the API shape.
4. **Nullable fields** — the API returns `T | null` for most fields when the scoreboard is disconnected. Always use null coalescing (`?? defaultValue`) when reading nullable fields.

### Type sync checklist

When you modify code that consumes `GET /live`, `GET /health`, or `GET /raw`:

- [ ] Confirm the field names and types match `apps/live-tracker/src/types/scoreboard-api.ts`
- [ ] If the generated types look stale, remind the user to run `npm run sync:api-types`
- [ ] Never add fields to the generated file — if a field is missing, the API models need updating first

## Overlay URL format

When referencing the custom broadcast overlay served by CRG ScoreBoard, the correct URL path is:

```
/custom/view/eod-custom-overlay/index.html?home=%23HEX&away=%23HEX
```

- The overlay lives in CRG's `html/custom/view/` directory, **not** `html/custom/` directly.
- `#` in hex colours must be URL-encoded as `%23` (e.g. `%231f3264` for `#1f3264`).
- Only `home` and `away` params are required. `homebg` and `awaybg` are optional.

## Conventions

- Use `snake_case` for all API field names (matches Python/Pydantic serialization).
- Use `camelCase` for all local TypeScript/React variables and component props.
- Clock values from the API are in **milliseconds** (fields suffixed `_ms`). Human-readable clocks are parallel `string` fields (e.g. `jam_clock_ms` + `jam_clock`).