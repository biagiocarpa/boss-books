# Lato Cliente & Incasso (Piano 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La metà "del cliente": link personale `/c/<8cifre>` con viste in sola lettura (libri + saldo) e pulsante "Richiedi pagamento"; lato admin la sezione "Richieste" per incassare; email di avviso al boss; e la correzione dell'azione "Reso".

**Architecture:** Le pagine cliente sono Server Components sotto `/c/[codice]` che leggono via service client filtrando per il codice dell'URL (il link È la credenziale; RLS come seconda barriera). Il saldo si deriva dal motore del Piano 1, esteso con un bucket "in richiesta" per non contare due volte i libri già agganciati a una richiesta in attesa. Le mutazioni (crea richiesta lato cliente, segna pagata lato admin) sono Server Actions che scrivono via service client. L'email è un effetto collaterale fail-safe via Resend.

**Tech Stack:** Next.js 16 (App Router, Server Actions) + React 19 + TypeScript, Tailwind v4, Supabase (service client server-only), Resend (email), Vitest. pnpm, Node 22+.

## Global Constraints

- Package manager pnpm; Node 22+. Lingua UI: italiano.
- Denaro in euro, 2 decimali half-up — via il motore `src/lib/consignment/` (mai ricalcolare a mano).
- Parametri di business dalla tabella `impostazioni` (mai hardcoded).
- Il **service client** (`src/lib/supabase/server.ts`) è solo server-side; mai importato in un Client Component.
- Regola anti-doppio-conteggio (spec §8.1): il saldo si deriva **solo** dallo stato dei libri + aggancio `richiesta_id`; l'`importo` della richiesta è storico, non si sottrae.
- **Disponibile** = quota dei libri `venduto`, maturati, con `richiesta_id IS NULL`. I libri `venduto` con `richiesta_id` valorizzato sono "in richiesta", non disponibili.
- Il cliente NON modifica i dati di pagamento (li mette il boss). Pagina cliente in sola lettura + unica azione "Richiedi pagamento".
- Una sola richiesta `richiesta` (in attesa) per cliente alla volta.
- L'email è un di più: se fallisce, la richiesta resta comunque registrata (errore loggato, non propagato).
- Palette nero/bianco/beige, mobile-first, caratteri grandi (target 40+).

---

### Task 1: Estendere il motore saldo — bucket "in richiesta" (TDD)

**Files:**
- Modify: `src/lib/consignment/balance.ts`
- Modify: `src/lib/consignment/balance.test.ts`

**Interfaces:**
- Consumes: `roundCents`, `isMatured` (esistenti).
- Produces (forme aggiornate):
  - `interface SoldBook { clientAmount: number; saleDate: Date; status: SoldBookStatus; inPendingRequest?: boolean }`
  - `interface Balance { available: number; maturing: number; requested: number; paid: number }`
  - `computeBalance(books, now, maturationDays)` con la nuova regola.

- [ ] **Step 1: Aggiornare i test (aggiungere il caso "in richiesta")**

In `src/lib/consignment/balance.test.ts`, sostituire il test esistente di `computeBalance` con questa versione estesa (aggiunge il campo `requested` e un libro `inPendingRequest`):

```ts
describe('computeBalance', () => {
  const now = new Date('2026-02-15T00:00:00Z')

  it('separa disponibile, in maturazione, in richiesta e pagato; ignora i resi', () => {
    const books: SoldBook[] = [
      { clientAmount: 10, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'venduto' }, // maturo, non in richiesta -> disponibile
      { clientAmount: 7, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'venduto', inPendingRequest: true }, // maturo ma in richiesta -> requested
      { clientAmount: 5, saleDate: new Date('2026-02-10T00:00:00Z'), status: 'venduto' }, // in maturazione
      { clientAmount: 20, saleDate: new Date('2025-12-01T00:00:00Z'), status: 'pagato' }, // pagato
      { clientAmount: 99, saleDate: new Date('2026-01-01T00:00:00Z'), status: 'reso' }, // ignorato
    ]
    const b = computeBalance(books, now, 30)
    expect(b.available).toBe(10)
    expect(b.requested).toBe(7)
    expect(b.maturing).toBe(5)
    expect(b.paid).toBe(20)
  })

  it('vuoto -> tutti zero', () => {
    expect(computeBalance([], now, 30)).toEqual({ available: 0, maturing: 0, requested: 0, paid: 0 })
  })
})
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `pnpm test src/lib/consignment/balance.test.ts`
Expected: FAIL (manca `requested`; il tipo non ha `inPendingRequest`).

- [ ] **Step 3: Aggiornare `SoldBook`, `Balance` e `computeBalance`**

In `src/lib/consignment/balance.ts`:

```ts
export interface SoldBook {
  clientAmount: number
  saleDate: Date
  status: SoldBookStatus
  /** True se il libro (venduto) è già agganciato a una richiesta in attesa. */
  inPendingRequest?: boolean
}

export interface Balance {
  /** Maturato, non pagato, NON in una richiesta: richiedibile. */
  available: number
  /** Venduto ma ancora in maturazione. */
  maturing: number
  /** Venduto+maturato ma già in una richiesta in attesa. */
  requested: number
  /** Già liquidato. */
  paid: number
}

export function computeBalance(books: SoldBook[], now: Date, maturationDays: number): Balance {
  let available = 0
  let maturing = 0
  let requested = 0
  let paid = 0

  for (const book of books) {
    if (book.status === 'reso') continue
    if (book.status === 'pagato') {
      paid += book.clientAmount
    } else if (book.inPendingRequest) {
      requested += book.clientAmount
    } else if (isMatured(book.saleDate, now, maturationDays)) {
      available += book.clientAmount
    } else {
      maturing += book.clientAmount
    }
  }

  return {
    available: roundCents(available),
    maturing: roundCents(maturing),
    requested: roundCents(requested),
    paid: roundCents(paid),
  }
}
```

- [ ] **Step 4: Eseguire e verificare che passino**

Run: `pnpm test src/lib/consignment/`
Expected: PASS (tutti; anche `canRequestPayout` e gli altri invariati).

- [ ] **Step 5: Commit**

```bash
git add src/lib/consignment/balance.ts src/lib/consignment/balance.test.ts
git commit -m "feat(consignment): bucket 'in richiesta' nel calcolo saldo"
```

---

### Task 2: Data layer — vista cliente (`client-view.ts`)

**Files:**
- Create: `src/lib/data/client-view.ts`

**Interfaces:**
- Consumes: `createServiceClient`; `getSettings` (Task 4 Piano 2); `computeBalance`, `SoldBook`, `Balance` (Task 1).
- Produces:
  - `interface ClientBookView { sku: string; titolo: string; stato: string; prezzo_vendita: number|null; quota_cliente: number|null; data_vendita: string|null; inPendingRequest: boolean }`
  - `interface ClientDashboard { cliente: { id: string; nome: string }; libri: ClientBookView[]; balance: Balance; pending: { id: string; importo: number; data_richiesta: string } | null }`
  - `async function getClientDashboard(codice: string): Promise<ClientDashboard | null>` — null se il codice non esiste.

- [ ] **Step 1: Implementare**

Create `src/lib/data/client-view.ts`:

```ts
import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/data/settings'
import { computeBalance, type SoldBook, type SoldBookStatus, type Balance } from '@/lib/consignment/balance'

export interface ClientBookView {
  sku: string
  titolo: string
  stato: string
  prezzo_vendita: number | null
  quota_cliente: number | null
  data_vendita: string | null
  inPendingRequest: boolean
}

export interface ClientDashboard {
  cliente: { id: string; nome: string }
  libri: ClientBookView[]
  balance: Balance
  pending: { id: string; importo: number; data_richiesta: string } | null
}

export async function getClientDashboard(codice: string): Promise<ClientDashboard | null> {
  const supabase = createServiceClient()

  const { data: cliente, error: cErr } = await supabase
    .from('clienti')
    .select('id, nome')
    .eq('id', codice)
    .maybeSingle()
  if (cErr) throw new Error(`Lettura cliente fallita: ${cErr.message}`)
  if (!cliente) return null

  const { data: libriRows, error: lErr } = await supabase
    .from('libri')
    .select('sku, titolo, stato, prezzo_vendita, data_vendita, quota_cliente, richiesta_id')
    .eq('cliente_id', codice)
    .order('sku')
  if (lErr) throw new Error(`Lettura libri fallita: ${lErr.message}`)

  const { data: pendingRow, error: pErr } = await supabase
    .from('richieste_pagamento')
    .select('id, importo, data_richiesta')
    .eq('cliente_id', codice)
    .eq('stato', 'richiesta')
    .maybeSingle()
  if (pErr) throw new Error(`Lettura richiesta fallita: ${pErr.message}`)

  const libri: ClientBookView[] = (libriRows ?? []).map((l) => ({
    sku: l.sku,
    titolo: l.titolo,
    stato: l.stato,
    prezzo_vendita: l.prezzo_vendita,
    quota_cliente: l.quota_cliente,
    data_vendita: l.data_vendita,
    inPendingRequest: l.stato === 'venduto' && l.richiesta_id != null,
  }))

  const settings = await getSettings()
  const soldBooks: SoldBook[] = libri
    .filter((l) => ['venduto', 'pagato', 'reso'].includes(l.stato) && l.quota_cliente != null && l.data_vendita != null)
    .map((l) => ({
      clientAmount: l.quota_cliente as number,
      saleDate: new Date(l.data_vendita as string),
      status: l.stato as SoldBookStatus,
      inPendingRequest: l.inPendingRequest,
    }))

  const balance = computeBalance(soldBooks, new Date(), settings.maturationDays)

  return {
    cliente: { id: cliente.id, nome: cliente.nome },
    libri,
    balance,
    pending: pendingRow ? { id: pendingRow.id, importo: pendingRow.importo, data_richiesta: pendingRow.data_richiesta } : null,
  }
}
```

Nota per l'implementer: `computeBalance` usa `new Date()` (ora corrente) — qui è codice server, non un test, quindi va bene (nei test di Task 1 la data è iniettata).

- [ ] **Step 2: Verificare build**

Run: `pnpm build`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/client-view.ts
git commit -m "feat(data): vista cliente (libri + saldo con bucket richiesta)"
```

---

### Task 3: Data layer — richieste di pagamento (`requests.ts`)

**Files:**
- Create: `src/lib/data/requests.ts`

**Interfaces:**
- Consumes: `createServiceClient`; `getSettings`.
- Produces:
  - `async function createPaymentRequest(clienteId: string): Promise<{ id: string; importo: number }>` — lancia con messaggio chiaro se: già una richiesta in attesa / niente disponibile / sotto il minimo.
  - `interface PendingRequestView { id: string; cliente_id: string; nome: string; dati_pagamento: string|null; importo: number; data_richiesta: string; libri: { sku: string; titolo: string }[] }`
  - `async function listPendingRequests(): Promise<PendingRequestView[]>`
  - `async function markRequestPaid(id: string): Promise<void>` — lancia se la richiesta non è più `richiesta`.

- [ ] **Step 1: Implementare `createPaymentRequest`**

Create `src/lib/data/requests.ts`:

```ts
import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { getSettings } from '@/lib/data/settings'
import { roundCents } from '@/lib/consignment/calculate'
import { isMatured } from '@/lib/consignment/balance'

export async function createPaymentRequest(clienteId: string): Promise<{ id: string; importo: number }> {
  const supabase = createServiceClient()
  const settings = await getSettings()

  // 1. Nessuna richiesta già in attesa
  const { data: existing, error: exErr } = await supabase
    .from('richieste_pagamento')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('stato', 'richiesta')
    .maybeSingle()
  if (exErr) throw new Error(`Verifica richiesta esistente fallita: ${exErr.message}`)
  if (existing) throw new Error('Hai già una richiesta di pagamento in lavorazione.')

  // 2. Libri incassabili: venduto, non ancora in una richiesta, maturati
  const { data: libri, error: lErr } = await supabase
    .from('libri')
    .select('sku, quota_cliente, data_vendita')
    .eq('cliente_id', clienteId)
    .eq('stato', 'venduto')
    .is('richiesta_id', null)
  if (lErr) throw new Error(`Lettura libri fallita: ${lErr.message}`)

  const now = new Date()
  const incassabili = (libri ?? []).filter(
    (l) => l.data_vendita != null && l.quota_cliente != null && isMatured(new Date(l.data_vendita), now, settings.maturationDays),
  )
  if (incassabili.length === 0) throw new Error('Nessun importo disponibile da richiedere.')

  const importo = roundCents(incassabili.reduce((sum, l) => sum + (l.quota_cliente as number), 0))
  if (importo < settings.minWithdrawal) {
    throw new Error(`Il disponibile (${importo.toFixed(2)} €) è sotto il minimo di ${settings.minWithdrawal.toFixed(2)} €.`)
  }

  // 3. Crea la richiesta
  const { data: reqRow, error: rErr } = await supabase
    .from('richieste_pagamento')
    .insert({ cliente_id: clienteId, importo, stato: 'richiesta' })
    .select('id')
    .single()
  if (rErr) throw new Error(`Creazione richiesta fallita: ${rErr.message}`)

  // 4. Aggancia i libri incassabili alla richiesta
  const skus = incassabili.map((l) => l.sku)
  const { error: uErr } = await supabase.from('libri').update({ richiesta_id: reqRow.id }).in('sku', skus)
  if (uErr) throw new Error(`Aggancio libri alla richiesta fallito: ${uErr.message}`)

  return { id: reqRow.id, importo }
}
```

- [ ] **Step 2: Implementare `listPendingRequests` e `markRequestPaid`**

Aggiungere in `src/lib/data/requests.ts`:

```ts
export interface PendingRequestView {
  id: string
  cliente_id: string
  nome: string
  dati_pagamento: string | null
  importo: number
  data_richiesta: string
  libri: { sku: string; titolo: string }[]
}

export async function listPendingRequests(): Promise<PendingRequestView[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('richieste_pagamento')
    .select('id, cliente_id, importo, data_richiesta, clienti(nome, dati_pagamento), libri(sku, titolo)')
    .eq('stato', 'richiesta')
    .order('data_richiesta')
  if (error) throw new Error(`Lettura richieste fallita: ${error.message}`)
  return (data ?? []).map((r) => {
    const cliente = Array.isArray(r.clienti) ? r.clienti[0] : r.clienti
    return {
      id: r.id,
      cliente_id: r.cliente_id,
      nome: cliente?.nome ?? '',
      dati_pagamento: cliente?.dati_pagamento ?? null,
      importo: r.importo,
      data_richiesta: r.data_richiesta,
      libri: (r.libri ?? []).map((l: { sku: string; titolo: string }) => ({ sku: l.sku, titolo: l.titolo })),
    }
  })
}

export async function markRequestPaid(id: string): Promise<void> {
  const supabase = createServiceClient()

  // Segna i libri agganciati come pagato
  const { data: libriUpd, error: lErr } = await supabase
    .from('libri')
    .update({ stato: 'pagato' })
    .eq('richiesta_id', id)
    .eq('stato', 'venduto')
    .select('sku')
  if (lErr) throw new Error(`Aggiornamento libri pagati fallito: ${lErr.message}`)

  // Segna la richiesta pagata solo se ancora in attesa
  const { data: reqUpd, error: rErr } = await supabase
    .from('richieste_pagamento')
    .update({ stato: 'pagata', data_pagamento: new Date().toISOString() })
    .eq('id', id)
    .eq('stato', 'richiesta')
    .select('id')
  if (rErr) throw new Error(`Aggiornamento richiesta fallito: ${rErr.message}`)
  if (!reqUpd || reqUpd.length === 0) {
    throw new Error('Richiesta inesistente o già evasa.')
  }
  void libriUpd
}
```

Nota per l'implementer: verificare che il join `clienti(...)`/`libri(...)` di PostgREST funzioni con questi nomi di relazione (FK esistenti: `libri.cliente_id`, `libri.richiesta_id`, `richieste_pagamento.cliente_id`). Se il nome della relazione annidata differisce, aggiustare la stringa `select` di conseguenza (il resto della logica non cambia).

- [ ] **Step 3: Verificare build**

Run: `pnpm build`
Expected: OK.

- [ ] **Step 4: Smoke contro il DB locale**

Con Supabase locale attivo, script usa-e-getta `scripts/smoke-req.mts` (poi cancellare): crea cliente, un libro venduto maturato (data_vendita 40 gg fa) con quota, imposta scaglioni/minimo, chiama `createPaymentRequest`, verifica importo e che il libro abbia `richiesta_id`; poi `markRequestPaid`, verifica libro `pagato` e richiesta `pagata`. Eseguire con `pnpm dlx tsx --env-file=.env.local scripts/smoke-req.mts`. **Cancellare lo script e le righe di test dopo; non committare lo script né tsx.**
Expected: importo corretto, aggancio ok, dopo il pagamento libro `pagato` + richiesta `pagata`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/requests.ts
git commit -m "feat(data): richieste pagamento (crea, lista pending, segna pagata)"
```

---

### Task 4: Email di avviso al boss (Resend)

**Files:**
- Create: `src/lib/email/notify.ts`
- Modify: `.env.local.example`

**Interfaces:**
- Consumes: `RESEND_API_KEY`, `EMAIL_FROM`, `BOSS_NOTIFY_EMAIL` (env).
- Produces:
  - `async function notifyPaymentRequest(input: { nome: string; importo: number; datiPagamento: string|null; codice: string }): Promise<void>` — invia l'email; **non lancia mai** (fail-safe: logga e ritorna).

- [ ] **Step 1: Installare resend**

```bash
pnpm add resend
```

- [ ] **Step 2: Implementare (fail-safe)**

Create `src/lib/email/notify.ts`:

```ts
import 'server-only'
import { Resend } from 'resend'

/** Avvisa il boss di una nuova richiesta di pagamento. Non lancia mai: l'email è un di più. */
export async function notifyPaymentRequest(input: {
  nome: string
  importo: number
  datiPagamento: string | null
  codice: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.BOSS_NOTIFY_EMAIL
  const from = process.env.EMAIL_FROM
  if (!apiKey || !to || !from) {
    console.warn('[notifyPaymentRequest] Config email mancante, salto invio')
    return
  }
  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from,
      to,
      subject: `Nuova richiesta di pagamento: ${input.nome} (${input.importo.toFixed(2)} €)`,
      text:
        `Il cliente ${input.nome} (codice ${input.codice}) ha richiesto il pagamento di ${input.importo.toFixed(2)} €.\n` +
        `Dati di pagamento: ${input.datiPagamento ?? '— (da inserire nel pannello)'}\n\n` +
        `Gestisci la richiesta: /admin/richieste`,
    })
  } catch (err) {
    console.error('[notifyPaymentRequest] Invio email fallito:', err)
  }
}
```

- [ ] **Step 3: Aggiornare `.env.local.example`**

Aggiungere in fondo a `.env.local.example`:

```
# Email di avviso richieste (Resend)
RESEND_API_KEY=
EMAIL_FROM=
BOSS_NOTIFY_EMAIL=
```

- [ ] **Step 4: Verificare build**

Run: `pnpm build`
Expected: OK.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/notify.ts .env.local.example package.json pnpm-lock.yaml
git commit -m "feat(email): avviso richiesta pagamento al boss (Resend, fail-safe)"
```

---

### Task 5: Pagina cliente `/c/[codice]` + azione richiesta

**Files:**
- Create: `src/app/c/[codice]/page.tsx`
- Create: `src/app/c/[codice]/actions.ts`

**Interfaces:**
- Consumes: `getClientDashboard` (Task 2), `createPaymentRequest` (Task 3), `notifyPaymentRequest` (Task 4).
- Produces: la vista pubblica del cliente (sola lettura + pulsante richiesta).

- [ ] **Step 1: Server action richiesta**

Create `src/app/c/[codice]/actions.ts`:

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { createPaymentRequest } from '@/lib/data/requests'
import { notifyPaymentRequest } from '@/lib/email/notify'
import { createServiceClient } from '@/lib/supabase/server'

export async function requestPaymentAction(codice: string) {
  const { importo } = await createPaymentRequest(codice)

  // Recupera nome + dati pagamento per l'email (fail-safe: non deve far fallire la richiesta)
  try {
    const supabase = createServiceClient()
    const { data } = await supabase.from('clienti').select('nome, dati_pagamento').eq('id', codice).maybeSingle()
    await notifyPaymentRequest({
      nome: data?.nome ?? '',
      importo,
      datiPagamento: data?.dati_pagamento ?? null,
      codice,
    })
  } catch {
    // notifyPaymentRequest è già fail-safe; questo catch copre solo la lettura nome
  }

  revalidatePath(`/c/${codice}`)
}
```

- [ ] **Step 2: Pagina cliente**

Create `src/app/c/[codice]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getClientDashboard } from '@/lib/data/client-view'
import { requestPaymentAction } from './actions'

export const dynamic = 'force-dynamic'

function statoLabel(l: { stato: string; inPendingRequest: boolean }): string {
  if (l.stato === 'in_vendita') return 'In vendita'
  if (l.stato === 'reso') return 'Reso'
  if (l.stato === 'pagato') return 'Pagato'
  if (l.stato === 'venduto') return l.inPendingRequest ? 'Venduto — in richiesta' : 'Venduto'
  return l.stato
}

export default async function ClientePage({ params }: { params: Promise<{ codice: string }> }) {
  const { codice } = await params
  const dash = await getClientDashboard(codice)
  if (!dash) notFound()

  const { cliente, libri, balance, pending } = dash
  const euro = (n: number) => `${n.toFixed(2)} €`

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-[#f5f1e6] p-5 text-black">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Ciao {cliente.nome}</h1>
        <p className="font-mono text-xs text-black/50">codice {cliente.id}</p>
      </header>

      <section className="mb-6 rounded border border-black/20 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Il tuo conto</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span>Disponibile</span><span className="text-right font-semibold">{euro(balance.available)}</span>
          <span>In maturazione</span><span className="text-right">{euro(balance.maturing)}</span>
          <span>In richiesta</span><span className="text-right">{euro(balance.requested)}</span>
          <span>Già pagato</span><span className="text-right">{euro(balance.paid)}</span>
        </div>

        <div className="mt-4">
          {pending ? (
            <p className="rounded bg-black/5 p-3 text-sm">
              Richiesta di {euro(pending.importo)} inviata, in lavorazione.
            </p>
          ) : balance.available > 0 ? (
            <form action={requestPaymentAction.bind(null, cliente.id)}>
              <button type="submit" className="w-full bg-black p-3 text-white">
                Richiedi pagamento ({euro(balance.available)})
              </button>
            </form>
          ) : (
            <p className="text-sm text-black/60">Nessun importo disponibile da richiedere.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">I tuoi libri ({libri.length})</h2>
        <ul className="flex flex-col gap-2">
          {libri.map((l) => (
            <li key={l.sku} className="flex items-center justify-between rounded border border-black/10 bg-white p-3">
              <div>
                <div>{l.titolo}</div>
                <div className="text-xs text-black/50">{statoLabel(l)}</div>
              </div>
              {l.quota_cliente != null && <div className="font-semibold">{euro(l.quota_cliente)}</div>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```

Nota: se `createPaymentRequest` lancia (es. race: due submit ravvicinati), Next mostra la error boundary di default. Il pulsante è già gated dal saldo lato UI; il throw resta come difesa. (UX errori inline: follow-up, coerente col resto dell'app.)

- [ ] **Step 3: Verifica manuale (dev server in background — NON in foreground)**

Prima: killare tutti i node, poi `pnpm dev` in background, confermare "Local: http://localhost:3000".
- Crea (dal pannello admin) un cliente, prendi il suo codice, aggiungi un libro, marcalo venduto.
- Apri `http://localhost:3000/c/<codice>` → vedi nome, conto, libri.
- Se il libro è appena venduto → "In maturazione"; il pulsante richiesta non c'è (disponibile 0).
- `curl` di controllo: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/c/<codice>` → 200; con un codice inesistente → 404.
Documentare gli esiti. Killare i node a fine verifica.

- [ ] **Step 4: Commit**

```bash
git add src/app/c
git commit -m "feat(cliente): pagina /c/[codice] (conto + libri + richiesta pagamento)"
```

---

### Task 6: Admin — sezione "Richieste" + incasso

**Files:**
- Create: `src/app/admin/richieste/page.tsx`
- Create: `src/app/admin/richieste/actions.ts`
- Modify: `src/app/admin/layout.tsx` (aggiungere il link "Richieste" nella nav)

**Interfaces:**
- Consumes: `listPendingRequests`, `markRequestPaid` (Task 3).
- Produces: la vista admin delle richieste in attesa con azione "Segna pagata".

- [ ] **Step 1: Server action**

Create `src/app/admin/richieste/actions.ts`:

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { markRequestPaid } from '@/lib/data/requests'

export async function markPaidAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim()
  if (!id) throw new Error('ID richiesta mancante')
  await markRequestPaid(id)
  revalidatePath('/admin/richieste')
}
```

- [ ] **Step 2: Pagina richieste**

Create `src/app/admin/richieste/page.tsx`:

```tsx
import { listPendingRequests } from '@/lib/data/requests'
import { markPaidAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function RichiestePage() {
  const richieste = await listPendingRequests()
  const euro = (n: number) => `${n.toFixed(2)} €`
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Richieste in attesa ({richieste.length})</h2>
      {richieste.length === 0 && <p className="text-sm text-black/60">Nessuna richiesta in attesa.</p>}
      <ul className="flex flex-col gap-3">
        {richieste.map((r) => (
          <li key={r.id} className="rounded border border-black/20 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{r.nome} <span className="font-mono text-xs text-black/50">({r.cliente_id})</span></div>
                <div className="text-sm">Importo: <strong>{euro(r.importo)}</strong></div>
                <div className="text-sm">Pagamento a: {r.dati_pagamento ?? '— (non inserito)'}</div>
                <div className="mt-1 text-xs text-black/50">Libri: {r.libri.map((l) => l.titolo).join(', ')}</div>
              </div>
              <form action={markPaidAction}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="bg-green-700 px-3 py-2 text-white">Segna pagata</button>
              </form>
            </div>
            <p className="mt-2 text-xs text-black/50">⚠️ Controlla il destinatario prima di pagare (il pagamento avviene fuori dall'app).</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 3: Aggiungere il link in nav**

In `src/app/admin/layout.tsx`, dentro il `<nav>`, aggiungere una voce "Richieste" tra "Clienti" e "Impostazioni":

```tsx
<a href="/admin/richieste">Richieste</a>
```

(Mantenere le voci esistenti e il form di logout.)

- [ ] **Step 4: Verifica manuale**

Con dev server in background (killare i node prima, confermare :3000):
- Crea una richiesta dal lato cliente (Task 5), poi apri `/admin/richieste` (loggato) → compare la richiesta con importo e dati pagamento.
- "Segna pagata" → sparisce dalla lista; sul lato cliente il conto mostra l'importo in "Già pagato" e i libri risultano "Pagato".
Documentare. Killare i node a fine.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/richieste src/app/admin/layout.tsx
git commit -m "feat(admin): sezione richieste + segna pagata"
```

---

### Task 7: Correzione UI "Reso" — su libri venduto

**Files:**
- Modify: `src/app/admin/clienti/[id]/page.tsx`

**Interfaces:**
- Consumes: `markReturnedAction` (già esistente, Task 8 Piano 2) — nessuna modifica al data layer (`markReturned` ammette già `venduto`).
- Produces: l'azione "Reso" mostrata sui libri `venduto` (in maturazione), non su `in_vendita`.

- [ ] **Step 1: Spostare il pulsante "Reso"**

In `src/app/admin/clienti/[id]/page.tsx`, nella colonna Azioni della tabella libri:
- Sotto `l.stato === 'in_vendita'` lasciare **solo** il form "Venduto" (rimuovere da qui il form "Reso").
- Aggiungere un ramo per `l.stato === 'venduto'` che mostra il form "Reso":

```tsx
{l.stato === 'venduto' && (
  <form action={markReturnedAction.bind(null, id)}>
    <input type="hidden" name="sku" value={l.sku} />
    <button type="submit" className="border px-2">Reso</button>
  </form>
)}
```

Assicurarsi che `markReturnedAction` resti importato. Il ramo `in_vendita` mantiene il form "Venduto" (con l'input prezzo) invariato.

- [ ] **Step 2: Verificare build**

Run: `pnpm build`
Expected: OK.

- [ ] **Step 3: Verifica manuale**

Con dev server in background: aprire un cliente con un libro `venduto` → compare "Reso"; premendolo il libro passa a `reso` e la sua quota esce dal conto del cliente (verificabile sulla pagina `/c/<codice>`). Un libro `in_vendita` mostra "Venduto"/nessun "Reso".

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/clienti/[id]/page.tsx"
git commit -m "fix(admin): azione Reso sui libri venduto (buyer return in maturazione)"
```

---

## Self-Review

**Spec coverage (§ spec Piano 3 → task):**
- §2 accesso link `/c/[codice]` sola lettura → Task 5 (page) + Task 2 (data).
- §3 viste cliente (libri + saldo, esclusi i libri in richiesta) → Task 1 (bucket requested) + Task 2 + Task 5.
- §4 richiesta pagamento (gate minimo + una alla volta + aggancio libri) → Task 3 (`createPaymentRequest`) + Task 5 (UI/gate).
- §5 admin richieste + segna pagata → Task 3 (`listPendingRequests`/`markRequestPaid`) + Task 6.
- §6 email al boss (fail-safe) → Task 4 + Task 5 (chiamata).
- §7 fix UI Reso su venduto → Task 7.
- §8 modello dati (nessuna tabella nuova; scritture via service client) → Task 2/3.
- §10 fuori scope rispettato (niente pagamenti parziali, niente modifica dati pagamento lato cliente, niente push).

**Placeholder scan:** nessun TODO/TBD nei passi di codice. La nota su PostgREST relation-name (Task 3 Step 2) è una verifica reale con fallback esplicito, non un placeholder.

**Type consistency:** `SoldBook`/`Balance` estesi in Task 1 e usati in Task 2; `ClientDashboard`/`ClientBookView` (Task 2) consumati in Task 5; `PendingRequestView` (Task 3) consumato in Task 6; `createPaymentRequest`→`{id, importo}` usato in Task 5; `markRequestPaid` in Task 6; `notifyPaymentRequest` firma coerente tra Task 4 e Task 5.

**Nota di sicurezza (cross-task):** le pagine `/c/[codice]` leggono/scrivono via service client filtrando per il codice dell'URL — coerente col modello di fiducia "link = credenziale" (spec §2). Nessun grant di scrittura ad anon; RLS resta seconda barriera. Il codice è preso da `params`, non da input arbitrario dell'utente oltre l'URL.

---

## Note per l'esecuzione

- Verifica: logica pura (Task 1) in TDD Vitest; data layer (Task 3) con smoke usa-e-getta contro il DB locale; UI (Task 5/6/7) manuale via dev server **in background** (mai foreground) previo kill di tutti i node e conferma porta 3000.
- Prerequisiti ambientali: Docker attivo, `.env.local` popolato. Per provare l'email in locale servono `RESEND_API_KEY`/`EMAIL_FROM`/`BOSS_NOTIFY_EMAIL`; se assenti, `notifyPaymentRequest` salta l'invio senza errori (la richiesta funziona lo stesso).
- Deploy: le stesse 3 variabili email vanno poi messe su Vercel quando si vuole l'avviso in produzione (non bloccante per il resto).
