# Conto Vendita Libri

*(nome definitivo dell'app ancora da decidere — "Conto Vendita Libri" è un working title)*

Web app (PWA) per la gestione di un **conto vendita di libri**: i conferitori danno libri al gestore, il gestore li vende su eBay, e l'app permette a ogni conferitore di tracciare lo stato dei propri libri e il proprio saldo. Include una dashboard per il saldo/payout. Target: 40+, clientela locale a Modena.

**Stato**: in sviluppo (fondamenta del progetto).

---

## Stack

| Layer            | Choice                                          |
| ---------------- | ------------------------------------------------ |
| Frontend         | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling          | Tailwind CSS v4                                 |
| Test             | Vitest (unit test)                              |
| Backend          | Supabase (Postgres + Auth) — *da aggiungere nei task successivi* |
| Package manager  | pnpm (non npm, non yarn)                        |
| Node             | 22 LTS o superiore                              |

---

## Comandi

| Comando          | Cosa fa                                     |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Dev server con HMR su http://localhost:3000 |
| `pnpm build`     | Production build                            |
| `pnpm start`     | Serve la build di produzione                |
| `pnpm lint`      | ESLint                                      |
| `pnpm test`      | Esegue i test una volta (Vitest)            |
| `pnpm test:watch`| Test in watch mode (Vitest)                 |

---

## Documenti del progetto

- [`docs/superpowers/specs/`](docs/superpowers/specs/) — specifiche di design/prodotto.
- [`docs/superpowers/plans/`](docs/superpowers/plans/) — piani di sviluppo.
