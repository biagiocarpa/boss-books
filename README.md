# ibar

Web app (PWA) che permette agli utenti di **dichiarare in anticipo** dove andranno (un bar a Modena, in una data), e vedere chi altro ha dichiarato lo stesso posto per la stessa serata. Check-in **forward-looking**, non retrospettivo. Target: 18+, Modena.

**Stato**: Sprint 0 in corso (setup iniziale). Pre-alpha. Non ancora deployato.

---

## Stack

| Layer           | Choice                                           |
| --------------- | ------------------------------------------------ |
| Frontend        | Next.js 16 (App Router) + React 19 + TypeScript  |
| Styling         | Tailwind CSS v4 (+ shadcn/ui quando serve)       |
| Backend         | Supabase (Postgres + Auth + Storage + Realtime)  |
| Region Supabase | eu-west-1 (Frankfurt) — vincolo GDPR             |
| Mappe           | MapLibre GL JS + tiles OpenFreeMap               |
| Dati POI        | OpenStreetMap via Overpass API                   |
| Email           | Resend (transactional)                           |
| Hosting         | Vercel (frontend) + Supabase Cloud (backend)     |
| Package manager | pnpm (non npm, non yarn)                         |
| Node            | 22 LTS o superiore (dev su Node 25, runtime LTS) |

---

## Prerequisites

- **Node.js** 22 LTS o superiore (`node -v`)
- **pnpm** 9 o superiore (`pnpm -v`) — `npm install -g pnpm` se mancante
- **Git** (`git --version`)
- **Supabase CLI** (richiesto da Sprint 0 task 21) — `pnpm dlx supabase --version`

---

## Setup locale

```bash
git clone git@github.com:biagiocarpa/ibar.git
cd ibar
pnpm install
cp .env.local.example .env.local   # poi compila le variabili
pnpm dev
```

Apri http://localhost:3000.

---

## Comandi

| Comando             | Cosa fa                                     |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | Dev server con HMR su http://localhost:3000 |
| `pnpm build`        | Production build (gira anche su Vercel)     |
| `pnpm start`        | Serve la build di produzione                |
| `pnpm lint`         | ESLint                                      |
| `pnpm format`       | Prettier write su tutto                     |
| `pnpm format:check` | Prettier check (per CI, non scrive)         |

Pre-commit hook (Husky + lint-staged) gira automaticamente Prettier + ESLint --fix sui file staged. Non serve invocarli a mano prima di `git commit`.

---

## Documenti del progetto

Leggere **in quest'ordine** prima di toccare codice:

1. [PRD.md](PRD.md) — Product Requirements Document. Scope, data model, safety/privacy model.
2. [PLAN.md](PLAN.md) — Piano in 9 sprint, dal setup all'open beta. Ogni sprint ha un checkpoint verificabile.
3. [STATUS.md](STATUS.md) — Tracker live del progresso. Si ticchetta solo dopo deploy in produzione, non "funziona in locale".
4. [CLAUDE.md](CLAUDE.md) — Contesto per Claude Code (auto-mode rules, stack closed, what NOT to do).

---

## Branch model

- `main` è sempre deployable (Vercel autodeploy collegato).
- Lavoro feature in branch `feature/<slug>`, PR a `main`.
- Ogni PR deve passare: `pnpm lint`, `pnpm build`, `pnpm format:check`, build preview Vercel.

---

## Deploy

Vercel autodeploy su push a `main` (configurato in Sprint 0 task 17). URL produzione: <https://ibar-azure.vercel.app>.
