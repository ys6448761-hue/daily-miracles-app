# Project Context — Daily Miracles MVP

## Service Overview
| Item | Value |
|------|-------|
| Name | 하루하루의 기적 (Daily Miracles) |
| Stack | Node.js 22, Express, OpenAI, Solapi, PostgreSQL |
| Deploy | Render (primary), Vercel (serverless preview) |
| Repo | github.com/ys6448761-hue/daily-miracles-app |
| Branch strategy | `main` (production), `feat/*` (features), `hotfix/*` (urgent) |

## Architecture Constraints
- Render: persistent disk, long-running process
- Vercel: **read-only `/var/task`**, writable `/tmp` only, cold-start per invocation
- All file I/O must be serverless-safe (guard + try-catch + fallback)
- Services use tolerant loading (`try/catch` → `null` if fails)

## Key Env Vars
| Var | Required | Notes |
|-----|----------|-------|
| `OPENAI_API_KEY` | Yes | GPT calls |
| `OPS_SLACK_WEBHOOK` | Prod only | Server exits if missing in production |
| `VERCEL` | Auto-set | Serverless detection flag |
| `NOW_REGION` | Auto-set | Vercel region detection |
| `DATABASE_URL` | Prod only | PostgreSQL |

## Current Priority: P2 Stability
See WORKFLOW.md for execution order.

---
*Last updated: 2026-02-22*
