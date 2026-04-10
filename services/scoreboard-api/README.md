# scoreboard-api

A Python asyncio service that connects to a [CRG ScoreBoard](https://github.com/rollerderby/scoreboard) WebSocket and re-exposes live game state via a simple HTTP API.

## Overview

This service acts as a bridge between the CRG roller derby scoreboard software and the Derby Stat Tracker monorepo. It connects to the CRG WebSocket feed, normalises the raw state, and serves it over HTTP so the web app and live-bridge service can consume it without needing a direct WebSocket connection.

## Source Repository

> ⚠️ The full source for this service lives in the separate [derby-scoreboard-api](https://github.com/a1ly404/derby-scoreboard-api) repository.
> Clone it here when setting up the monorepo locally:
>
> ```sh
> git clone https://github.com/a1ly404/derby-scoreboard-api services/scoreboard-api
> ```

## Endpoints

| Method | Path      | Description                                                  |
|--------|-----------|--------------------------------------------------------------|
| GET    | `/live`   | Cleaned live game state (scores, clock, jammers, lead, etc.) |
| GET    | `/raw`    | Raw CRG WebSocket state                                      |
| GET    | `/health` | Connection status — always returns 200                       |
| GET    | `/docs`   | OpenAPI / Swagger UI                                         |

### `/live` Response Shape

```json
{
  "connected": true,
  "period": 1,
  "jam": 4,
  "jam_clock": "01:23",
  "period_clock": "14:37",
  "team1": {
    "name": "Bells of the Brawl",
    "score": 42,
    "jam_score": 10,
    "jammer": "Lylability",
    "lead": true,
    "lost_lead": false,
    "called_off": false
  },
  "team2": {
    "name": "Daisy Pushers",
    "score": 31,
    "jam_score": 5,
    "jammer": "Green Bean",
    "lead": false,
    "lost_lead": false,
    "called_off": false
  }
}
```

When the scoreboard is not connected, `/live` returns **503 Service Unavailable** with `"connected": false`.

## Running Locally

```sh
cd services/scoreboard-api

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service (defaults: proxy port 5001, backend ports 5002/5003)
python main.py
```

### Environment Variables

| Variable              | Default               | Description                        |
|-----------------------|-----------------------|------------------------------------|
| `CRG_WS_URL`          | `ws://localhost:8000` | CRG scoreboard WebSocket URL       |
| `API_PORT`            | `5001`                | HTTP port for this service         |
| `LOG_LEVEL`           | `INFO`                | Python logging level               |

Create a `.env` file in this directory (it is git-ignored):

```env
CRG_WS_URL=ws://localhost:8000
API_PORT=5001
LOG_LEVEL=INFO
```

## Running Tests

```sh
cd services/scoreboard-api
pip install -r requirements-dev.txt
pytest
```

Tests use a mock WebSocket server so no live CRG instance is required.

## Architecture Notes

- Uses **Python asyncio** throughout — a single event loop handles the WebSocket connection and the HTTP server.
- Has **auto-reconnect** logic — if the CRG WebSocket drops, the service retries with exponential back-off without restarting.
- The **blue/green updater** tooling (Windows-focused) allows zero-downtime updates by running two backend instances (ports 5002/5003) behind a proxy (port 5001).

## Integration with the Monorepo

| Consumer              | How it uses this service                                    |
|-----------------------|-------------------------------------------------------------|
| `apps/web`            | Polls `GET /live` from the browser for real-time display    |
| `services/live-bridge`| Polls `GET /live` server-side and writes snapshots to Supabase |

Both consumers read `VITE_SCOREBOARD_API_URL` (web) or `SCOREBOARD_API_URL` (live-bridge) to locate this service. In a typical local setup this will be `http://localhost:5001`.