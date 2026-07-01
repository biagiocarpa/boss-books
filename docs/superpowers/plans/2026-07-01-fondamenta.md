# Fondamenta (Piano 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettere in piedi lo scaffold del progetto (stack `ibar`), lo schema DB con le policy di sicurezza (RLS), e il motore di calcolo del conto vendita testato in TDD — la base su cui poggiano Admin, Cliente e Vetrina.

**Architecture:** App PWA Next.js su Vercel, dati su Supabase (Postgres + Auth). La logica di calcolo (netto eBay, scaglioni, quota cliente, maturazione, saldo) vive in un modulo TypeScript **puro** (nessuna dipendenza da rete/DB) così è testabile in isolamento e riusabile sia dal lato admin sia dal lato cliente. Il DB applica le regole di visibilità: l'admin vede tutto, il cliente vede solo le righe col proprio prefisso di 8 cifre.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS v4 + shadcn/ui, Supabase (Postgres + Auth), Vitest per i test unitari, pnpm, Node 22 LTS. Hosting Vercel + Supabase Cloud (region eu-west-1 Frankfurt).

## Global Constraints

- **Package manager:** pnpm (non npm, non yarn) — copiato da `ibar`.
- **Node:** 22 LTS o superiore.
- **Region Supabase:** eu-west-1 (Frankfurt) — vincolo GDPR.
- **Lingua UI e copy:** italiano.
- **Denaro:** tutti gli importi in euro, arrotondati a 2 decimali (centesimi), arrotondamento matematico standard (half-up) al centesimo.
- **Spedizione:** mai inclusa nei calcoli del conto.
- **Codice cliente:** 8 cifre casuali, non sequenziali.
- **Parametri di business** (commissione eBay, scaglioni, giorni maturazione, minimo prelievo) **non vanno mai hardcoded**: vivono in tabella `impostazioni` ed sono modificabili da admin.
- **Default di business (valori iniziali, poi modificabili):** commissione eBay 5%, maturazione 30 giorni, minimo prelievo 20 €. Gli scaglioni esatti li definisce il boss — nessun valore inventato oltre a quelli usati negli esempi dei test.

---

### Task 1: Scaffold del progetto e tooling

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `.gitignore`, `.env.local.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `.nvmrc` (contenuto: `22`)

**Interfaces:**
- Consumes: nulla (primo task).
- Produces: un progetto Next.js che builda e serve una home; Vitest configurato ed eseguibile con `pnpm test`.

- [ ] **Step 1: Creare l'app Next.js con TypeScript, Tailwind, App Router**

Dalla cartella del progetto (`c:/Users/bcarpaneto/projects/boss`), scaffolding nella cartella corrente:

```bash
pnpm dlx create-next-app@latest . \
  --ts --app --tailwind --eslint --src-dir \
  --import-alias "@/*" --use-pnpm --no-turbopack
```

Se `create-next-app` chiede conferma per cartella non vuota (ci sono le immagini WhatsApp e i docs), rispondere di **procedere** senza sovrascrivere; le immagini restano intatte.

- [ ] **Step 2: Aggiungere Vitest e le sue dipendenze**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Creare `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 4: Aggiungere gli script a `package.json`**

Nel blocco `"scripts"` assicurarsi che siano presenti:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 5: Creare `.env.local.example`**

```
# Supabase (compilare con i valori del progetto Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 6: Scrivere un test di sanità del setup**

Create `src/lib/setup.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('setup', () => {
  it('esegue i test TypeScript', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 7: Eseguire test e build per verificare lo scaffold**

Run: `pnpm test`
Expected: PASS (1 test passa).

Run: `pnpm build`
Expected: build completata senza errori.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Vitest (stack ibar)"
```

---

### Task 2: Motore di calcolo — quota del cliente per singolo libro

**Files:**
- Create: `src/lib/consignment/types.ts`
- Create: `src/lib/consignment/calculate.ts`
- Test: `src/lib/consignment/calculate.test.ts`

**Interfaces:**
- Consumes: nulla (modulo puro).
- Produces:
  - `interface CommissionTier { maxPrice: number | null; sellerPercent: number }`
  - `interface BusinessSettings { ebayCommissionPercent: number; tiers: CommissionTier[]; maturationDays: number; minWithdrawal: number }`
  - `interface Breakdown { net: number; sellerCut: number; clientAmount: number }`
  - `function roundCents(value: number): number`
  - `function sellerPercentForPrice(price: number, tiers: CommissionTier[]): number`
  - `function clientShare(salePrice: number, settings: BusinessSettings): Breakdown`

- [ ] **Step 1: Scrivere i tipi**

Create `src/lib/consignment/types.ts`:

```ts
/** Uno scaglione di prezzo: la % che il boss trattiene per libri fino a `maxPrice`. */
export interface CommissionTier {
  /** Prezzo massimo (incluso) della fascia; null = fascia superiore senza limite. */
  maxPrice: number | null
  /** Percentuale trattenuta dal boss (es. 60 = 60%). */
  sellerPercent: number
}

/** Parametri di business, provenienti dalla tabella `impostazioni`. */
export interface BusinessSettings {
  /** Commissione eBay in percentuale (es. 5 = 5%). */
  ebayCommissionPercent: number
  /** Scaglioni ordinati per maxPrice crescente; l'ultimo ha maxPrice = null. */
  tiers: CommissionTier[]
  /** Giorni di maturazione dalla data di vendita. */
  maturationDays: number
  /** Cifra minima richiedibile in euro. */
  minWithdrawal: number
}

/** Scomposizione del ricavo di un libro venduto. */
export interface Breakdown {
  /** Prezzo di vendita al netto della commissione eBay. */
  net: number
  /** Quota trattenuta dal boss. */
  sellerCut: number
  /** Quota spettante al cliente. */
  clientAmount: number
}
```

- [ ] **Step 2: Scrivere i test che falliscono (arrotondamento + selezione scaglione)**

Create `src/lib/consignment/calculate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { roundCents, sellerPercentForPrice } from './calculate'
import type { CommissionTier } from './types'

describe('roundCents', () => {
  it('arrotonda a 2 decimali (half-up)', () => {
    expect(roundCents(9.5)).toBe(9.5)
    expect(roundCents(5.705)).toBe(5.71)
    expect(roundCents(28.499)).toBe(28.5)
  })
})

describe('sellerPercentForPrice', () => {
  const tiers: CommissionTier[] = [
    { maxPrice: 20, sellerPercent: 60 },
    { maxPrice: 50, sellerPercent: 40 },
    { maxPrice: null, sellerPercent: 30 },
  ]

  it('sceglie la fascia bassa per libri economici', () => {
    expect(sellerPercentForPrice(10, tiers)).toBe(60)
    expect(sellerPercentForPrice(20, tiers)).toBe(60) // bordo incluso
  })

  it('sceglie la fascia intermedia', () => {
    expect(sellerPercentForPrice(35, tiers)).toBe(40)
  })

  it('sceglie la fascia superiore senza limite', () => {
    expect(sellerPercentForPrice(100, tiers)).toBe(30)
  })
})
```

- [ ] **Step 3: Eseguire i test per verificare che falliscano**

Run: `pnpm test src/lib/consignment/calculate.test.ts`
Expected: FAIL con "roundCents is not a function" / modulo non trovato.

- [ ] **Step 4: Implementare `roundCents` e `sellerPercentForPrice`**

Create `src/lib/consignment/calculate.ts`:

```ts
import type { BusinessSettings, Breakdown, CommissionTier } from './types'

/** Arrotonda a 2 decimali (centesimi), half-up. */
export function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Restituisce la percentuale trattenuta dal boss per un dato prezzo.
 * Gli scaglioni sono ordinati per maxPrice crescente; l'ultimo ha maxPrice null.
 */
export function sellerPercentForPrice(price: number, tiers: CommissionTier[]): number {
  for (const tier of tiers) {
    if (tier.maxPrice === null || price <= tier.maxPrice) {
      return tier.sellerPercent
    }
  }
  throw new Error('Nessuno scaglione applicabile: manca la fascia superiore (maxPrice null)')
}
```

- [ ] **Step 5: Eseguire i test per verificare che passino**

Run: `pnpm test src/lib/consignment/calculate.test.ts`
Expected: PASS.

- [ ] **Step 6: Aggiungere i test di `clientShare` (esempi della spec)**

Aggiungere in coda a `src/lib/consignment/calculate.test.ts`:

```ts
import { clientShare } from './calculate'
import type { BusinessSettings } from './types'

describe('clientShare', () => {
  const settings: BusinessSettings = {
    ebayCommissionPercent: 5,
    tiers: [
      { maxPrice: 20, sellerPercent: 60 },
      { maxPrice: 50, sellerPercent: 40 },
      { maxPrice: null, sellerPercent: 30 },
    ],
    maturationDays: 30,
    minWithdrawal: 20,
  }

  it('libro economico 10€ → cliente 3,80€', () => {
    const b = clientShare(10, settings)
    expect(b.net).toBe(9.5)
    expect(b.sellerCut).toBe(5.7)
    expect(b.clientAmount).toBe(3.8)
  })

  it('libro costoso 100€ → cliente 66,50€', () => {
    const b = clientShare(100, settings)
    expect(b.net).toBe(95)
    expect(b.sellerCut).toBe(28.5)
    expect(b.clientAmount).toBe(66.5)
  })
})
```

- [ ] **Step 7: Eseguire i nuovi test per verificare che falliscano**

Run: `pnpm test src/lib/consignment/calculate.test.ts`
Expected: FAIL con "clientShare is not a function".

- [ ] **Step 8: Implementare `clientShare`**

Aggiungere in `src/lib/consignment/calculate.ts`:

```ts
/** Scompone il ricavo di un libro venduto in netto, quota boss e quota cliente. */
export function clientShare(salePrice: number, settings: BusinessSettings): Breakdown {
  const net = roundCents(salePrice - salePrice * (settings.ebayCommissionPercent / 100))
  const sellerPercent = sellerPercentForPrice(salePrice, settings.tiers)
  const sellerCut = roundCents(net * (sellerPercent / 100))
  const clientAmount = roundCents(net - sellerCut)
  return { net, sellerCut, clientAmount }
}
```

- [ ] **Step 9: Eseguire tutti i test del modulo**

Run: `pnpm test src/lib/consignment/calculate.test.ts`
Expected: PASS (tutti).

- [ ] **Step 10: Commit**

```bash
git add src/lib/consignment/
git commit -m "feat: motore calcolo quota cliente (netto + scaglioni)"
```

---

### Task 3: Motore di calcolo — maturazione e saldo del cliente

**Files:**
- Modify: `src/lib/consignment/calculate.ts`
- Test: `src/lib/consignment/balance.test.ts`
- Create: `src/lib/consignment/balance.ts`

**Interfaces:**
- Consumes: `clientShare`, `roundCents`, `BusinessSettings` dal Task 2.
- Produces:
  - `type SoldBookStatus = 'venduto' | 'reso' | 'pagato'`
  - `interface SoldBook { clientAmount: number; saleDate: Date; status: SoldBookStatus }`
  - `interface Balance { available: number; maturing: number; paid: number }`
  - `function isMatured(saleDate: Date, now: Date, maturationDays: number): boolean`
  - `function computeBalance(books: SoldBook[], now: Date, maturationDays: number): Balance`
  - `function canRequestPayout(balance: Balance, minWithdrawal: number): boolean`

- [ ] **Step 1: Scrivere i test di `isMatured` (falliscono)**

Create `src/lib/consignment/balance.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isMatured, computeBalance, canRequestPayout } from './balance'
import type { SoldBook } from './balance'

describe('isMatured', () => {
  it('non maturo dentro la finestra di 30 giorni', () => {
    const sale = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-20T00:00:00Z') // +19 giorni
    expect(isMatured(sale, now, 30)).toBe(false)
  })

  it('maturo esattamente al 30° giorno', () => {
    const sale = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-31T00:00:00Z') // +30 giorni
    expect(isMatured(sale, now, 30)).toBe(true)
  })

  it('maturo oltre i 30 giorni', () => {
    const sale = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-03-01T00:00:00Z')
    expect(isMatured(sale, now, 30)).toBe(true)
  })
})
```

- [ ] **Step 2: Eseguire per verificare il fallimento**

Run: `pnpm test src/lib/consignment/balance.test.ts`
Expected: FAIL (modulo `./balance` non trovato).

- [ ] **Step 3: Implementare `isMatured` e i tipi in `balance.ts`**

Create `src/lib/consignment/balance.ts`:

```ts
import { roundCents } from './calculate'

export type SoldBookStatus = 'venduto' | 'reso' | 'pagato'

/** Un libro venduto rilevante per il conto del cliente. */
export interface SoldBook {
  /** Quota spettante al cliente per questo libro (già calcolata). */
  clientAmount: number
  /** Data di vendita. */
  saleDate: Date
  /** Stato ai fini del conto. */
  status: SoldBookStatus
}

export interface Balance {
  /** Maturato e non ancora pagato: cifra richiedibile. */
  available: number
  /** Venduto ma ancora dentro la finestra di maturazione. */
  maturing: number
  /** Già liquidato al cliente. */
  paid: number
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** True se sono trascorsi almeno `maturationDays` dalla vendita. */
export function isMatured(saleDate: Date, now: Date, maturationDays: number): boolean {
  const elapsedDays = (now.getTime() - saleDate.getTime()) / MS_PER_DAY
  return elapsedDays >= maturationDays
}
```

- [ ] **Step 4: Eseguire per verificare che `isMatured` passi**

Run: `pnpm test src/lib/consignment/balance.test.ts`
Expected: PASS (i 3 test di isMatured).

- [ ] **Step 5: Aggiungere i test di `computeBalance` e `canRequestPayout` (falliscono)**

Aggiungere in coda a `src/lib/consignment/balance.test.ts`:

```ts
describe('computeBalance', () => {
  const now = new Date('2026-02-15T00:00:00Z')

  it('separa disponibile, in maturazione e pagato; ignora i resi', () => {
    const books: SoldBook[] = [
      { clientAmount: 10, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'venduto' }, // maturo
      { clientAmount: 5, saleDate: new Date('2026-02-10T00:00:00Z'), status: 'venduto' },  // in maturazione
      { clientAmount: 20, saleDate: new Date('2025-12-01T00:00:00Z'), status: 'pagato' },  // pagato
      { clientAmount: 99, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'reso' },    // ignorato
    ]
    const b = computeBalance(books, now, 30)
    expect(b.available).toBe(10)
    expect(b.maturing).toBe(5)
    expect(b.paid).toBe(20)
  })
})

describe('canRequestPayout', () => {
  it('vero solo se il disponibile raggiunge il minimo', () => {
    expect(canRequestPayout({ available: 25, maturing: 0, paid: 0 }, 20)).toBe(true)
    expect(canRequestPayout({ available: 20, maturing: 0, paid: 0 }, 20)).toBe(true)
    expect(canRequestPayout({ available: 19.99, maturing: 0, paid: 0 }, 20)).toBe(false)
  })
})
```

- [ ] **Step 6: Eseguire per verificare il fallimento**

Run: `pnpm test src/lib/consignment/balance.test.ts`
Expected: FAIL ("computeBalance is not a function").

- [ ] **Step 7: Implementare `computeBalance` e `canRequestPayout`**

Aggiungere in `src/lib/consignment/balance.ts`:

```ts
/**
 * Aggrega i libri venduti di un cliente in {disponibile, in maturazione, pagato}.
 * I libri 'reso' sono esclusi dal conto.
 */
export function computeBalance(books: SoldBook[], now: Date, maturationDays: number): Balance {
  let available = 0
  let maturing = 0
  let paid = 0

  for (const book of books) {
    if (book.status === 'reso') continue
    if (book.status === 'pagato') {
      paid += book.clientAmount
    } else if (isMatured(book.saleDate, now, maturationDays)) {
      available += book.clientAmount
    } else {
      maturing += book.clientAmount
    }
  }

  return {
    available: roundCents(available),
    maturing: roundCents(maturing),
    paid: roundCents(paid),
  }
}

/** True se il cliente può richiedere il pagamento (disponibile >= minimo). */
export function canRequestPayout(balance: Balance, minWithdrawal: number): boolean {
  return balance.available >= minWithdrawal
}
```

- [ ] **Step 8: Eseguire tutti i test del modulo consignment**

Run: `pnpm test src/lib/consignment/`
Expected: PASS (tutti i test dei Task 2 e 3).

- [ ] **Step 9: Commit**

```bash
git add src/lib/consignment/
git commit -m "feat: maturazione e calcolo saldo cliente"
```

---

### Task 4: Client Supabase e schema del database

**Files:**
- Create: `supabase/migrations/0001_schema.sql`
- Create: `src/lib/supabase/client.ts` (client browser)
- Create: `src/lib/supabase/server.ts` (client server-side/service-role)
- Modify: `.env.local` (locale, non committato)

**Interfaces:**
- Consumes: variabili d'ambiente Supabase.
- Produces:
  - tabelle `clienti`, `libri`, `richieste_pagamento`, `impostazioni`
  - `function createBrowserClient()` e `function createServiceClient()`

- [ ] **Step 1: Installare le dipendenze Supabase**

```bash
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D supabase
```

- [ ] **Step 2: Inizializzare Supabase locale**

```bash
pnpm dlx supabase init
```

Questo crea la cartella `supabase/`. Committarla.

- [ ] **Step 3: Scrivere la migration dello schema**

Create `supabase/migrations/0001_schema.sql`:

```sql
-- Clienti: id = 8 cifre casuali (stringa per preservare zeri iniziali)
create table clienti (
  id text primary key check (id ~ '^[0-9]{8}$'),
  nome text not null,
  contatti text,
  dati_pagamento text,           -- PayPal/IBAN, testo libero per l'MVP
  note text,
  creato_il timestamptz not null default now()
);

-- Libri: sku = prefisso cliente (8) + suffisso libro
create table libri (
  sku text primary key,
  cliente_id text not null references clienti(id),
  titolo text not null,
  prezzo_listino numeric(10,2) not null,
  stato text not null default 'in_vendita'
    check (stato in ('in_vendita','venduto','reso','pagato')),
  prezzo_vendita numeric(10,2),
  data_vendita timestamptz,
  quota_cliente numeric(10,2),   -- calcolata al momento della vendita
  creato_il timestamptz not null default now(),
  constraint sku_inizia_con_cliente check (sku like cliente_id || '%')
);
create index libri_cliente_idx on libri(cliente_id);

-- Richieste di pagamento
create table richieste_pagamento (
  id uuid primary key default gen_random_uuid(),
  cliente_id text not null references clienti(id),
  importo numeric(10,2) not null,
  stato text not null default 'richiesta' check (stato in ('richiesta','pagata')),
  data_richiesta timestamptz not null default now(),
  data_pagamento timestamptz
);
create index richieste_cliente_idx on richieste_pagamento(cliente_id);

-- Impostazioni: riga singola con i parametri di business
create table impostazioni (
  id int primary key default 1 check (id = 1),
  commissione_ebay_percent numeric(5,2) not null default 5,
  scaglioni jsonb not null default '[]'::jsonb,  -- [{maxPrice, sellerPercent}]
  giorni_maturazione int not null default 30,
  minimo_prelievo numeric(10,2) not null default 20
);
insert into impostazioni (id) values (1);
```

- [ ] **Step 4: Applicare la migration in locale**

```bash
pnpm dlx supabase start
pnpm dlx supabase migration up
```

Expected: le tabelle vengono create senza errori. Verificare con:

```bash
pnpm dlx supabase db diff
```
Expected: nessuna differenza pendente.

- [ ] **Step 5: Scrivere i client Supabase**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

Create `src/lib/supabase/server.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

/** Client con service-role: SOLO server-side (bypassa RLS). Mai importare nel browser. */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}
```

- [ ] **Step 6: Verificare che il progetto builda ancora**

Run: `pnpm build`
Expected: build OK.

- [ ] **Step 7: Commit**

```bash
git add supabase/ src/lib/supabase/ .env.local.example
git commit -m "feat: schema DB e client Supabase"
```

---

### Task 5: Sicurezza — RLS (admin vede tutto, cliente vede solo il proprio prefisso)

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

**Interfaces:**
- Consumes: le tabelle del Task 4.
- Produces: policy RLS che isolano i dati per cliente. Il lato cliente accede via client anon passando il proprio prefisso come claim/parametro; il lato admin usa il service-role o un utente autenticato.

**Nota di design (punto di sicurezza più delicato dell'MVP):** il cliente non è un utente email/password. L'accesso avviene tramite le 8 cifre. Per l'MVP il prefisso viaggia come impostazione di sessione Postgres (`request.jwt.claims` non è disponibile senza Auth), quindi le query lato cliente passano SEMPRE per una funzione server-side che imposta `app.current_cliente` e filtra. Le RLS sono la seconda linea di difesa.

- [ ] **Step 1: Scrivere la migration RLS**

Create `supabase/migrations/0002_rls.sql`:

```sql
-- Attiva RLS su tutte le tabelle dati
alter table clienti enable row level security;
alter table libri enable row level security;
alter table richieste_pagamento enable row level security;
alter table impostazioni enable row level security;

-- Prefisso cliente della sessione corrente (impostato dal server via set_config)
create or replace function current_cliente() returns text
language sql stable as $$
  select nullif(current_setting('app.current_cliente', true), '')
$$;

-- CLIENTI: il cliente vede solo se stesso
create policy cliente_self on clienti
  for select using (id = current_cliente());

-- LIBRI: il cliente vede solo i propri libri
create policy libri_del_cliente on libri
  for select using (cliente_id = current_cliente());

-- RICHIESTE: il cliente vede solo le proprie
create policy richieste_del_cliente on richieste_pagamento
  for select using (cliente_id = current_cliente());

-- IMPOSTAZIONI: lettura pubblica dei parametri (servono al calcolo lato cliente),
-- nessuna scrittura via anon (le scritture passano dal service-role lato admin)
create policy impostazioni_read on impostazioni
  for select using (true);
```

- [ ] **Step 2: Applicare la migration**

```bash
pnpm dlx supabase migration up
```
Expected: applicata senza errori.

- [ ] **Step 3: Verificare l'isolamento con una query SQL manuale**

Aprire la console SQL locale:

```bash
pnpm dlx supabase db reset   # ricrea da zero + riapplica migrations
```

Poi in uno script SQL (via `psql` sulla connessione locale mostrata da `supabase status`), inserire due clienti e due libri e verificare l'isolamento:

```sql
insert into clienti(id, nome) values ('11111111','A'), ('22222222','B');
insert into libri(sku, cliente_id, titolo, prezzo_listino)
  values ('1111111100000001','11111111','Libro A', 10),
         ('2222222200000001','22222222','Libro B', 20);

-- Simula la sessione del cliente A (ruolo anon + prefisso impostato)
set role anon;
select set_config('app.current_cliente', '11111111', false);
select sku from libri;   -- Expected: SOLO '1111111100000001'
reset role;
```
Expected: con il prefisso di A si vede solo il libro di A.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "feat: RLS isolamento dati per cliente"
```

---

## Self-Review

**Spec coverage (§ della spec → task):**
- §5 codici/identità → Task 4 (constraint `sku like cliente_id || '%'`, id 8 cifre).
- §6 impostazioni configurabili → Task 4 (tabella `impostazioni`) + Task 2/3 (le leggono, non le hardcodano).
- §7 calcolo conto → Task 2 (clientShare) con gli esempi 10€/100€ della spec come test.
- §4 ciclo di vita / stati → Task 4 (enum `stato`) + Task 3 (maturazione, resi esclusi).
- §8 flusso pagamento (dati/soglia) → Task 3 (`canRequestPayout`) + Task 4 (tabella richieste).
- §9 stack → Task 1.
- Sicurezza accesso cliente (§9 nota) → Task 5 (RLS + funzione `current_cliente`).
- **Non coperti da questo piano (per design, vanno nei Piani 2–4):** UI admin, UI cliente, flusso di richiesta/marcatura pagamento lato interfaccia, vetrina pubblica, PWA/manifest, palette nero/bianco/beige.

**Placeholder scan:** nessun TODO/TBD nei passi di codice; gli scaglioni usati nei test sono valori d'esempio dichiarati, non parametri di produzione.

**Type consistency:** `BusinessSettings`, `CommissionTier`, `Breakdown` (Task 2) riusati in Task 3; `SoldBook`/`Balance` definiti in Task 3 e usati coerentemente; `roundCents` esportato da `calculate.ts` e importato in `balance.ts`.

---

## Piani successivi (da scrivere dopo l'esecuzione del Piano 1)

- **Piano 2 — Admin:** login credenziali, CRUD clienti/libri con auto-generazione SKU, segna venduto (usa `clientShare`), segna reso/pagato, editor impostazioni/scaglioni.
- **Piano 3 — Accesso Cliente:** sessione via 8 cifre + `set_config`, viste sola-lettura dei libri e del conto (usa `computeBalance`), profilo con dati di pagamento, pulsante "Richiedi pagamento".
- **Piano 4 — Vetrina & PWA:** pagina pubblica con logo e link eBay, manifest PWA + icona home, palette nero/bianco/beige.
