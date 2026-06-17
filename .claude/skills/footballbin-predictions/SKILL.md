---
name: footballbin-predictions
description: AI-powered football match predictions for Premier League and Champions League via the FootballBin MCP API. Use when the user asks for match predictions, score forecasts, next goal scorer, corner counts, or player form for upcoming Premier League / Champions League fixtures.
---

# FootballBin Match Predictions

AI-powered predictions for Premier League and Champions League matches, retrieved
through the public FootballBin MCP API using a small shell wrapper.

## Key Capabilities

- Half-time and full-time score predictions
- Next goal scorer identification
- Corner count forecasts
- Player form / key player analysis

## Supported Leagues

- **Premier League** — aliases: `premier_league`, `epl`, `pl`, `prem`
- **Champions League** — aliases: `champions_league`, `ucl`, `cl`

## How to Use

Run the bundled `scripts/footballbin.sh` script.

```bash
# List the available MCP tools
scripts/footballbin.sh tools

# All predictions for the current Premier League matchweek
scripts/footballbin.sh predictions premier_league

# A specific matchweek
scripts/footballbin.sh predictions epl 27

# Filter by team (common aliases supported, e.g. "united", "barca")
scripts/footballbin.sh predictions premier_league --home arsenal
scripts/footballbin.sh predictions ucl --away barcelona
```

### Command reference

| Command | Description |
| --- | --- |
| `tools` | List available MCP tools |
| `predictions <league> [matchweek]` | Get match predictions; optional `--home <team>` / `--away <team>` filters |

## Requirements

- `curl` — required to call the endpoint
- `jq` — optional, used to pretty-print results (raw JSON is printed if absent)

## Data & Security

- Connects to a public, rate-limited AWS endpoint: `https://ru7m5svay1.execute-api.eu-central-1.amazonaws.com/prod/mcp`
- No API authentication required
- Read-only: no user data is collected or stored
- Data sent: league name, matchweek number, and team name filters only (no PII)

## Additional Resources

Predictions integrate with the FootballBin mobile apps available on iOS and Android.
