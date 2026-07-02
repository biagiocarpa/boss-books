# Navigazione 3 icone, Catalogo, Storico (Fase 5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Barra a 3 icone (Negozio/Libri/Profilo) sulle pagine cliente, catalogo pubblico di tutti i libri del boss, e storico pagamenti nel profilo — per allineare l'app agli schizzi originali del boss.

**Architecture:** Un layout di segmento `src/app/c/[codice]/layout.tsx` monta la barra fissa in basso (il codice resta nell'URL, nessuna sessione). Il catalogo è una pagina figlia (`/c/[codice]/libri`) che legge da un nuovo data layer `listCatalog()` (soli campi pubblici). Lo storico usa `listPaidRequests(clienteId)` aggiunto a `requests.ts`. Nessuna migration.

**Tech Stack:** invariato (Next 16 App Router, Supabase service client server-only, Tailwind v4). Nessuna dipendenza nuova.

## Global Constraints

- Branch `feature/navigazione` (da `main`, PR 1–4 mergiate). pnpm; UI in italiano; PowerShell per i comandi (Bash inaffidabile in sessione).
- **Catalogo: SOLO dati pubblici** — titolo, stato ("In vendita"/"Venduto"), prezzo (listino se in vendita, vendita se venduto). MAI cliente_id, quota_cliente, codici. `reso` escluso. `pagato` mostrato come "Venduto".
- **Pagina cliente resta sola lettura** (unica azione: Richiedi pagamento, invariata).
- Link negozio: `process.env.NEXT_PUBLIC_EBAY_STORE_URL ?? 'https://www.ebay.it/usr/trovalibro.mo'` (stesso pattern della vetrina).
- Denaro col motore esistente; `.toFixed(2)` per il display. Palette: beige `#f5f1e6`, blu `#092145`, giallo `#F4BD25`.
- Mobile-first, barra fissa in basso, contenuti con padding-bottom per non finire sotto la barra.

---

### Task 1: Data layer — `listCatalog()` + `listPaidRequests()`

**Files:**
- Create: `src/lib/data/catalog.ts`
- Modify: `src/lib/data/requests.ts` (aggiunta in coda)

**Interfaces:**
- Produces:
  - `interface CatalogBook { titolo: string; stato: 'in_vendita' | 'venduto'; prezzo: number }`
  - `async function listCatalog(): Promise<CatalogBook[]>` — tutti i libri ≠ reso, mappando pagato→venduto; prezzo = listino per in_vendita, vendita per venduto; ordinati: in_vendita prima (per titolo), poi venduto (per titolo).
  - `interface PaidRequestView { importo: number; data_pagamento: string }`
  - `async function listPaidRequests(clienteId: string): Promise<PaidRequestView[]>` — richieste `pagata` del cliente, più recenti prima.

- [ ] **Step 1: Creare `src/lib/data/catalog.ts`**

```ts
import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

/** Voce del catalogo pubblico: SOLI dati pubblici (mai cliente_id o quote). */
export interface CatalogBook {
  titolo: string
  stato: 'in_vendita' | 'venduto'
  prezzo: number
}

/** Tutti i libri del boss (esclusi i resi), con i soli campi pubblici stile eBay. */
export async function listCatalog(): Promise<CatalogBook[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('libri')
    .select('titolo, stato, prezzo_listino, prezzo_vendita')
    .neq('stato', 'reso')
    .order('titolo')
  if (error) throw new Error(`Lettura catalogo fallita: ${error.message}`)

  const books: CatalogBook[] = (data ?? []).map((l) => {
    const venduto = l.stato === 'venduto' || l.stato === 'pagato'
    return {
      titolo: l.titolo,
      stato: venduto ? 'venduto' : 'in_vendita',
      prezzo: venduto ? (l.prezzo_vendita ?? l.prezzo_listino) : l.prezzo_listino,
    }
  })
  // In vendita prima, poi venduti (entrambi già in ordine di titolo dalla query)
  return [...books.filter((b) => b.stato === 'in_vendita'), ...books.filter((b) => b.stato === 'venduto')]
}
```

- [ ] **Step 2: Aggiungere `listPaidRequests` in coda a `src/lib/data/requests.ts`**

```ts
export interface PaidRequestView {
  importo: number
  data_pagamento: string
}

/** Storico pagamenti del cliente: richieste pagate, più recenti prima. */
export async function listPaidRequests(clienteId: string): Promise<PaidRequestView[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('richieste_pagamento')
    .select('importo, data_pagamento')
    .eq('cliente_id', clienteId)
    .eq('stato', 'pagata')
    .order('data_pagamento', { ascending: false })
  if (error) throw new Error(`Lettura storico pagamenti fallita: ${error.message}`)
  return (data ?? []).filter((r) => r.data_pagamento != null) as PaidRequestView[]
}
```

- [ ] **Step 3: Build**

Run: `pnpm build` — Expected: OK.

- [ ] **Step 4: Commit**

```powershell
git add src/lib/data/catalog.ts src/lib/data/requests.ts
git -c commit.gpgsign=false commit -m "feat(data): catalogo pubblico + storico pagamenti cliente"
```

---

### Task 2: Layout cliente con barra a 3 icone

**Files:**
- Create: `src/app/c/[codice]/layout.tsx`

**Interfaces:**
- Consumes: `params.codice` (dal segmento), `NEXT_PUBLIC_EBAY_STORE_URL`.
- Produces: barra fissa in basso ereditata da `/c/[codice]` e `/c/[codice]/libri`.

- [ ] **Step 1: Creare il layout**

```tsx
const EBAY_URL = process.env.NEXT_PUBLIC_EBAY_STORE_URL ?? 'https://www.ebay.it/usr/trovalibro.mo'

export default async function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ codice: string }>
}) {
  const { codice } = await params
  return (
    <div className="min-h-screen bg-[#f5f1e6] pb-20">
      {children}
      <nav className="fixed inset-x-0 bottom-0 border-t border-black/20 bg-white">
        <div className="mx-auto flex max-w-xl">
          <a
            href={EBAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-0.5 p-2 text-xs"
          >
            <span aria-hidden className="text-xl">🛒</span>
            Negozio
          </a>
          <a href={`/c/${codice}/libri`} className="flex flex-1 flex-col items-center gap-0.5 p-2 text-xs">
            <span aria-hidden className="text-xl">📚</span>
            Libri
          </a>
          <a href={`/c/${codice}`} className="flex flex-1 flex-col items-center gap-0.5 p-2 text-xs">
            <span aria-hidden className="text-xl">👤</span>
            Profilo
          </a>
        </div>
      </nav>
    </div>
  )
}
```

Nota: niente stato "voce attiva" via JS — per l'MVP la barra è identica su entrambe le pagine (un layout è un Server Component; l'evidenziazione attiva richiederebbe un Client Component con usePathname: rimandata, non essenziale).

- [ ] **Step 2: Adeguare la pagina profilo**

In `src/app/c/[codice]/page.tsx`: il `<main>` ha già `min-h-screen bg-[#f5f1e6]` — ora lo sfondo lo dà il layout; sostituire la className del `<main>` con `mx-auto max-w-xl p-5 text-black` (rimuovendo `min-h-screen bg-[#f5f1e6]` per evitare doppio sfondo; il padding-bottom lo dà il layout).

- [ ] **Step 3: Build**

Run: `pnpm build` — Expected: OK.

- [ ] **Step 4: Commit**

```powershell
git add "src/app/c/[codice]/layout.tsx" "src/app/c/[codice]/page.tsx"
git -c commit.gpgsign=false commit -m "feat(cliente): barra di navigazione a 3 icone (Negozio/Libri/Profilo)"
```

---

### Task 3: Pagina catalogo `/c/[codice]/libri`

**Files:**
- Create: `src/app/c/[codice]/libri/page.tsx`

**Interfaces:**
- Consumes: `listCatalog()` (Task 1); il layout del Task 2.

- [ ] **Step 1: Creare la pagina**

```tsx
import { listCatalog } from '@/lib/data/catalog'

export const dynamic = 'force-dynamic'

const EBAY_URL = process.env.NEXT_PUBLIC_EBAY_STORE_URL ?? 'https://www.ebay.it/usr/trovalibro.mo'

export default async function CatalogoPage() {
  const libri = await listCatalog()
  const inVendita = libri.filter((l) => l.stato === 'in_vendita')
  const venduti = libri.filter((l) => l.stato === 'venduto')

  return (
    <main className="mx-auto max-w-xl p-5 text-black">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">I libri di TrovaLibro.MO</h1>
        <a
          href={EBAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded bg-[#F4BD25] px-4 py-2 font-semibold"
        >
          Compra su eBay
        </a>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">In vendita ({inVendita.length})</h2>
        <ul className="flex flex-col gap-2">
          {inVendita.map((l, i) => (
            <li key={i} className="flex items-center justify-between rounded border border-black/10 bg-white p-3">
              <span>{l.titolo}</span>
              <span className="font-semibold">{l.prezzo.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        {inVendita.length === 0 && <p className="text-sm text-black/60">Nessun libro in vendita al momento.</p>}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Venduti ({venduti.length})</h2>
        <ul className="flex flex-col gap-2">
          {venduti.map((l, i) => (
            <li key={i} className="flex items-center justify-between rounded border border-black/10 bg-white p-3 opacity-70">
              <span>{l.titolo}</span>
              <span className="text-sm">Venduto · {l.prezzo.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        {venduti.length === 0 && <p className="text-sm text-black/60">Ancora nessuna vendita.</p>}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Build**

Run: `pnpm build` — Expected: OK, rotta `ƒ /c/[codice]/libri` presente.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/c/[codice]/libri"
git -c commit.gpgsign=false commit -m "feat(cliente): catalogo pubblico dei libri (dati pubblici stile eBay)"
```

---

### Task 4: Storico pagamenti nel profilo

**Files:**
- Modify: `src/app/c/[codice]/page.tsx`

**Interfaces:**
- Consumes: `listPaidRequests` (Task 1).

- [ ] **Step 1: Aggiungere la sezione**

In `src/app/c/[codice]/page.tsx`:
- import: `import { listPaidRequests } from '@/lib/data/requests'`
- nel componente, dopo `getClientDashboard`: `const pagamenti = await listPaidRequests(codice)`
- dopo la sezione "I tuoi libri", aggiungere:

```tsx
<section className="mt-6">
  <h2 className="mb-3 text-lg font-semibold">Pagamenti ricevuti</h2>
  {pagamenti.length === 0 ? (
    <p className="text-sm text-black/60">Nessun pagamento ricevuto finora.</p>
  ) : (
    <ul className="flex flex-col gap-2">
      {pagamenti.map((p, i) => (
        <li key={i} className="flex items-center justify-between rounded border border-black/10 bg-white p-3">
          <span className="text-sm">{new Date(p.data_pagamento).toLocaleDateString('it-IT')}</span>
          <span className="font-semibold">{euro(p.importo)}</span>
        </li>
      ))}
    </ul>
  )}
</section>
```

(La helper `euro` esiste già nella pagina.)

- [ ] **Step 2: Build + test**

Run: `pnpm build` poi `pnpm test` — Expected: build OK, 26 test verdi.

- [ ] **Step 3: Verifica integrata leggera (Supabase locale attivo)**

Con Docker/Supabase su: dev server in background (kill node prima, confermare :3000), inserire via psql un cliente `88888888` con un libro in vendita e uno venduto+richiesta pagata; poi:
- `GET /c/88888888` → 200 (profilo con storico)
- `GET /c/88888888/libri` → 200 (catalogo con entrambe le sezioni)
Pulire le righe di test e killare i node. Se Docker è giù, segnalare la verifica come rimandata al preview (non fingere).

- [ ] **Step 4: Commit**

```powershell
git add "src/app/c/[codice]/page.tsx"
git -c commit.gpgsign=false commit -m "feat(cliente): storico pagamenti nel profilo"
```

---

## Self-Review

**Spec coverage:** §3 nav → Task 2; §4 catalogo (dati pubblici, reso escluso, pagato=venduto, ordinamento, CTA eBay) → Task 1+3; §5 storico → Task 1+4; §2 vincoli (sola lettura, soli dati pubblici) rispettati nei componenti (nessuna nuova azione, nessun campo privato nel catalogo).
**Placeholder scan:** nessuno.
**Type consistency:** `CatalogBook`/`listCatalog` (Task 1→3); `PaidRequestView`/`listPaidRequests` (Task 1→4); `euro` riusata (già in page.tsx).
**Nota privacy:** `listCatalog` non seleziona `cliente_id` né `sku` → impossibile mostrare per errore dati riservati in pagina.
