# Tema Carta & Inchiostro (wow-factor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Applicare il tema "Carta & Inchiostro" approvato nei mockup: home = Frontespizio (B2 ornata), Libri = Registro, Profilo = Libretto del conto, barra nav in tema. Restyling puro: zero logica, zero dipendenze.

**Architecture:** Le classi condivise del tema (`.parch`, `.riga`, `.timbro`, `.ink-btn`, `.titolo-sez`, `.cornice`, `.font-libro`, `.navbar-carta`) vivono in `globals.css`; le pagine le usano accanto a Tailwind per il layout. Nessun componente nuovo: si ristilizzano home, CatalogoView, pagina cliente, pagina /profilo e ClientNav.

**Tech Stack:** invariato (Next 16, Tailwind v4, CSS puro). Georgia di sistema, nessun webfont.

## Global Constraints

- Branch `feature/tema-biblioteca` (da main, PR #6 mergiata). PowerShell per i comandi (Bash inaffidabile).
- **Restyling puro**: nessuna modifica a logica/dati/rotte/azioni. `pnpm test` deve restare 26/26 e il build verde.
- Token (dalla spec, verbatim): carta `#f3e9d2`; righe `rgba(9,33,69,.055)` ogni 26px; invecchiatura `inset 0 0 60px rgba(107,85,53,.3)` (home `.35`); inchiostro `#092145`; rosso mattone `#8b3a2e`; ceralacca radial `#c0533f → #7b2d26`; timbro verde `#2e5d34`; nav carta `#ece0c4`; bottoni: fondo inchiostro, testo carta, ombra `0 2px 0 #8b3a2e`; serif Georgia.
- Admin NON si tocca. Manifest/icone NON si toccano. `logo.jpg` resta in public (non più usato in home).
- I mockup approvati sono il riferimento: `.superpowers/brainstorm/1212-1783415736/content/home-carta-inchiostro.html` (B2) e `libri-profilo-b2.html`.

---

### Task 1: Classi tema in globals.css

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces (classi usate dai task 2–5): `.font-libro`, `.parch`, `.parch-invecchiata`, `.cornice`, `.ink-btn`, `.riga`, `.titolo-sez`, `.timbro`, `.timbro-blu`, `.ceralacca`, `.navbar-carta`, `.nav-voce`, `.nav-voce-attiva`.

- [ ] **Step 1: Aggiungere il blocco tema in coda a `src/app/globals.css`**

Appendere (senza toccare il contenuto esistente):

```css
/* === Tema "Carta & Inchiostro" (spec 2026-07-02-tema-biblioteca) === */

.font-libro {
  font-family: Georgia, 'Times New Roman', serif;
}

/* Carta pergamena rigata */
.parch {
  background-color: #f3e9d2;
  background-image: repeating-linear-gradient(
    0deg, transparent, transparent 25px, rgba(9, 33, 69, 0.055) 26px
  );
  box-shadow: inset 0 0 60px rgba(107, 85, 53, 0.3);
}
.parch-invecchiata {
  box-shadow: inset 0 0 60px rgba(107, 85, 53, 0.35);
}

/* Cornice doppia da frontespizio */
.cornice {
  border: 2px solid #092145;
  outline: 1px solid #8b3a2e;
  outline-offset: 4px;
}

/* Bottone inchiostro */
.ink-btn {
  background: #092145;
  color: #f3e9d2;
  font-weight: 700;
  text-align: center;
  padding: 0.75rem;
  border-radius: 2px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 0 #8b3a2e;
  display: block;
  width: 100%;
}

/* Riga di registro */
.riga {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  border-bottom: 1px dotted rgba(9, 33, 69, 0.45);
  padding: 0.45rem 0.15rem 0.25rem;
}

/* Titolo di sezione: ❦ MAIUSCOLO SPAZIATO ❦ */
.titolo-sez {
  font-size: 0.7rem;
  letter-spacing: 3px;
  color: #8b3a2e;
  text-align: center;
  text-transform: uppercase;
  margin: 1rem 0 0.35rem;
}

/* Timbri */
.timbro {
  display: inline-block;
  border: 2px solid #2e5d34;
  color: #2e5d34;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 1px 5px;
  border-radius: 3px;
  transform: rotate(-8deg);
  opacity: 0.85;
  text-transform: uppercase;
}
.timbro-blu {
  border-color: #092145;
  color: #092145;
}

/* Sigillo di ceralacca */
.ceralacca {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #c0533f, #7b2d26 70%);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f3e9d2;
  font-size: 0.6rem;
  font-weight: 700;
  transform: rotate(-10deg);
}

/* Barra di navigazione in tema */
.navbar-carta {
  border-top: 1.5px solid #092145;
  background: #ece0c4;
}
.nav-voce {
  color: #3d4c63;
}
.nav-voce-attiva {
  background: #f3e9d2;
  border-top: 2.5px solid #8b3a2e;
  margin-top: -2px;
  font-weight: 700;
  color: #092145;
}
```

- [ ] **Step 2: Build**

Run: `pnpm build` — Expected: OK (classi inutilizzate finché i task successivi non le usano: nessun errore).

- [ ] **Step 3: Commit**

```powershell
git add src/app/globals.css
git -c commit.gpgsign=false commit -m "feat(tema): classi Carta & Inchiostro in globals.css"
```

---

### Task 2: ClientNav in tema

**Files:**
- Modify: `src/components/client-nav.tsx`

**Interfaces:**
- Consumes: classi Task 1. Stessa firma del componente (nessun cambio props).

- [ ] **Step 1: Sostituire gli stili della barra**

Contenuto completo aggiornato di `src/components/client-nav.tsx`:

```tsx
'use client'
import { usePathname } from 'next/navigation'

/**
 * Barra di navigazione a 3 icone (Negozio / Libri / Profilo). Solo UI, nessun accesso a dati.
 * Con `codice` punta alle pagine personali; senza, alle varianti pubbliche (/libri, /profilo).
 */
export function ClientNav({ codice, ebayUrl }: { codice?: string; ebayUrl: string }) {
  const pathname = usePathname()
  const profiloHref = codice ? `/c/${codice}` : '/profilo'
  const libriHref = codice ? `/c/${codice}/libri` : '/libri'
  const isLibri = pathname === libriHref
  const isProfilo = pathname === profiloHref

  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 p-2 text-xs font-libro ${
      active ? 'nav-voce-attiva' : 'nav-voce'
    }`

  return (
    <nav className="navbar-carta fixed inset-x-0 bottom-0">
      <div className="mx-auto flex max-w-xl">
        <a href={ebayUrl} target="_blank" rel="noopener noreferrer" className={item(false)}>
          <span aria-hidden className="text-xl">🛒</span>
          Negozio
        </a>
        <a href={libriHref} className={item(isLibri)} aria-current={isLibri ? 'page' : undefined}>
          <span aria-hidden className="text-xl">📚</span>
          Libri
        </a>
        <a href={profiloHref} className={item(isProfilo)} aria-current={isProfilo ? 'page' : undefined}>
          <span aria-hidden className="text-xl">👤</span>
          Profilo
        </a>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Build**

Run: `pnpm build` — Expected: OK.

- [ ] **Step 3: Commit**

```powershell
git add src/components/client-nav.tsx
git -c commit.gpgsign=false commit -m "feat(tema): barra di navigazione su carta"
```

---

### Task 3: Home — Frontespizio (B2 ornata)

**Files:**
- Modify: `src/app/page.tsx` (riscrittura completa)

**Interfaces:**
- Consumes: classi Task 1/2; `/icon-192.png` (esiste in public/); `ClientNav`, `EBAY_URL`.

- [ ] **Step 1: Riscrivere `src/app/page.tsx`**

Contenuto completo:

```tsx
import Image from 'next/image'
import { ClientNav } from '@/components/client-nav'
import { EBAY_URL } from '@/lib/ebay'

export default function Home() {
  return (
    <main className="parch parch-invecchiata font-libro relative min-h-screen pb-24 text-black">
      <span aria-hidden className="absolute left-3 top-2 text-xl text-[#8b3a2e]">❝</span>
      <span aria-hidden className="absolute right-3 top-2 text-xl text-[#8b3a2e]">❞</span>

      <div className="mx-auto max-w-xl px-6 pt-8">
        <section className="cornice relative px-4 py-6 text-center">
          <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— EX LIBRIS —</div>
          <Image
            src="/icon-192.png"
            alt="Stemma TrovaLibro.MO"
            width={88}
            height={88}
            priority
            className="mx-auto mt-2 rounded-md"
          />
          <h1 className="mt-2 text-3xl font-bold text-[#092145]">TrovaLibro.MO</h1>
          <div aria-hidden className="text-2xl leading-none text-[#8b3a2e]">❦</div>
          <p className="italic text-[#3d4c63]">Ogni libro trova il suo lettore</p>
          <div className="ceralacca absolute -bottom-4 -right-3">MO</div>
        </section>

        <p className="mt-6 text-[17px] leading-relaxed">
          <span aria-hidden className="float-left pr-2 text-5xl font-bold leading-[0.8] text-[#8b3a2e]">
            A
          </span>
          ffidaci i tuoi libri: li mettiamo in vendita sul nostro negozio eBay e tu segui tutto dal
          telefono — lo stato di ogni libro e quanto ti spetta, in ogni momento.
        </p>

        <a href={EBAY_URL} target="_blank" rel="noopener noreferrer" className="ink-btn mt-6 text-lg">
          Visita il negozio eBay
        </a>

        <p className="mt-5 text-sm text-[#3d4c63]">
          Hai dei libri in conto vendita con noi? Apri il tuo <strong>link personale</strong> — o
          tocca <strong>Profilo</strong> qui sotto e inserisci il tuo codice — per vedere i tuoi
          libri e il tuo conto.
        </p>

        <footer className="mt-8 text-center text-xs text-[#6b5535]">
          <span aria-hidden>❦</span> TrovaLibro.MO ·{' '}
          <a href="/admin" className="underline">
            Area admin
          </a>{' '}
          <span aria-hidden>❦</span>
        </footer>
      </div>

      <ClientNav ebayUrl={EBAY_URL} />
    </main>
  )
}
```

- [ ] **Step 2: Build**

Run: `pnpm build` — Expected: OK, `/` statica.

- [ ] **Step 3: Commit**

```powershell
git add src/app/page.tsx
git -c commit.gpgsign=false commit -m "feat(tema): home come frontespizio (EX LIBRIS, stemma, ceralacca)"
```

---

### Task 4: CatalogoView — Il Registro

**Files:**
- Modify: `src/components/catalogo-view.tsx` (riscrittura completa)

**Interfaces:**
- Consumes: classi Task 1; `listCatalog` invariato (stessa query, stessi dati).

- [ ] **Step 1: Riscrivere `src/components/catalogo-view.tsx`**

Contenuto completo:

```tsx
import { listCatalog } from '@/lib/data/catalog'
import { EBAY_URL } from '@/lib/ebay'

/** Vista del catalogo pubblico (soli dati pubblici). Server Component condiviso tra /libri e /c/[codice]/libri. */
export async function CatalogoView() {
  const libri = await listCatalog()
  const inVendita = libri.filter((l) => l.stato === 'in_vendita')
  const venduti = libri.filter((l) => l.stato === 'venduto')

  return (
    <main className="font-libro mx-auto max-w-xl p-5 text-black">
      <header className="border-b-2 border-[#092145] pb-2 text-center">
        <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— REGISTRO DEI LIBRI —</div>
        <h1 className="text-xl font-bold text-[#092145]">TrovaLibro.MO</h1>
      </header>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> In vendita ({inVendita.length}) <span aria-hidden>❦</span>
        </h2>
        <ul>
          {inVendita.map((l, i) => (
            <li key={i} className="riga text-[15px]">
              <span>{l.titolo}</span>
              <span className="whitespace-nowrap font-bold text-[#092145]">{l.prezzo.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        {inVendita.length === 0 && (
          <p className="text-sm text-black/60">Nessun libro in vendita al momento.</p>
        )}
      </section>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> Venduti ({venduti.length}) <span aria-hidden>❦</span>
        </h2>
        <ul>
          {venduti.map((l, i) => (
            <li key={i} className="riga text-[15px] opacity-65">
              <span>{l.titolo}</span>
              <span className="whitespace-nowrap">
                <span className="timbro">Venduto</span> {l.prezzo.toFixed(2)} €
              </span>
            </li>
          ))}
        </ul>
        {venduti.length === 0 && <p className="text-sm text-black/60">Ancora nessuna vendita.</p>}
      </section>

      <a href={EBAY_URL} target="_blank" rel="noopener noreferrer" className="ink-btn mt-6">
        Compra su eBay
      </a>
    </main>
  )
}
```

- [ ] **Step 2: Adeguare lo sfondo di `/libri`**

In `src/app/libri/page.tsx`, sostituire la className del `div` esterno `min-h-screen bg-[#f5f1e6] pb-20` con `parch min-h-screen pb-24`.

- [ ] **Step 3: Adeguare lo sfondo del layout cliente**

In `src/app/c/[codice]/layout.tsx`, sostituire la className del `div` esterno `min-h-screen bg-[#f5f1e6] pb-20` con `parch min-h-screen pb-24`.

- [ ] **Step 4: Build**

Run: `pnpm build` — Expected: OK.

- [ ] **Step 5: Commit**

```powershell
git add src/components/catalogo-view.tsx src/app/libri/page.tsx "src/app/c/[codice]/layout.tsx"
git -c commit.gpgsign=false commit -m "feat(tema): catalogo come registro della biblioteca"
```

---

### Task 5: Profilo — Il Libretto (+ pagina inserisci codice)

**Files:**
- Modify: `src/app/c/[codice]/page.tsx` (riscrittura completa del markup, logica INVARIATA)
- Modify: `src/app/profilo/page.tsx` (restyling del form)

**Interfaces:**
- Consumes: classi Task 1; `getClientDashboard`, `listPaidRequests`, `requestPaymentAction`, `statoLabel` (tutti invariati).

- [ ] **Step 1: Riscrivere `src/app/c/[codice]/page.tsx`**

Contenuto completo (ATTENZIONE: import, `statoLabel`, fetch e gating identici a prima — cambia solo il JSX):

```tsx
import { notFound } from 'next/navigation'
import { getClientDashboard } from '@/lib/data/client-view'
import { listPaidRequests } from '@/lib/data/requests'
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
  const pagamenti = await listPaidRequests(codice)
  const euro = (n: number) => `${n.toFixed(2)} €`

  return (
    <main className="font-libro mx-auto max-w-xl p-5 text-black">
      <header className="text-center">
        <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— LIBRETTO DEL CONTO —</div>
        <h1 className="text-2xl font-bold text-[#092145]">Ciao {cliente.nome}</h1>
        <p className="font-mono text-xs text-[#6b5535]">codice {cliente.id}</p>
      </header>

      <section className="cornice mt-4 px-4 py-3">
        <div className="riga border-b border-dotted border-[#092145]/45">
          <span className="font-bold">Disponibile</span>
          <span className="text-lg font-bold text-[#092145]">{euro(balance.available)}</span>
        </div>
        <div className="riga">
          <span>In maturazione</span>
          <span>{euro(balance.maturing)}</span>
        </div>
        <div className="riga">
          <span>In richiesta</span>
          <span>{euro(balance.requested)}</span>
        </div>
        <div className="riga border-b-0">
          <span>Già pagato</span>
          <span>{euro(balance.paid)}</span>
        </div>
      </section>

      <div className="mt-5">
        {pending ? (
          <p className="rounded bg-[#092145]/5 p-3 text-sm">
            Richiesta di {euro(pending.importo)} inviata, in lavorazione.
          </p>
        ) : balance.available > 0 ? (
          <form action={requestPaymentAction.bind(null, cliente.id)}>
            <button type="submit" className="ink-btn text-lg">
              Richiedi pagamento ({euro(balance.available)})
            </button>
          </form>
        ) : (
          <p className="text-sm text-[#3d4c63]">Nessun importo disponibile da richiedere.</p>
        )}
      </div>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> I tuoi libri ({libri.length}) <span aria-hidden>❦</span>
        </h2>
        <ul>
          {libri.map((l) => (
            <li key={l.sku} className="riga text-[15px]">
              <span>
                {l.titolo}{' '}
                {l.stato === 'venduto' || l.stato === 'pagato' ? (
                  <span className="timbro timbro-blu">{statoLabel(l)}</span>
                ) : (
                  <span className="text-xs italic text-[#3d4c63]">{statoLabel(l)}</span>
                )}
              </span>
              {l.quota_cliente != null && (
                <span className="whitespace-nowrap font-bold text-[#092145]">{euro(l.quota_cliente)}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> Pagamenti ricevuti <span aria-hidden>❦</span>
        </h2>
        {pagamenti.length === 0 ? (
          <p className="text-sm text-black/60">Nessun pagamento ricevuto finora.</p>
        ) : (
          <ul>
            {pagamenti.map((p, i) => (
              <li key={i} className="riga text-[15px]">
                <span className="text-sm">{new Date(p.data_pagamento).toLocaleDateString('it-IT')}</span>
                <span className="whitespace-nowrap">
                  <span className="timbro">Pagato</span> <b>{euro(p.importo)}</b>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Restyling `src/app/profilo/page.tsx`**

Contenuto completo (azione e testi invariati):

```tsx
import { ClientNav } from '@/components/client-nav'
import { EBAY_URL } from '@/lib/ebay'
import { vaiAlProfiloAction } from './actions'

/** Ingresso al profilo per chi arriva senza link personale: inserisce il suo codice a 8 cifre. */
export default async function ProfiloPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>
}) {
  const { errore } = await searchParams
  return (
    <div className="parch font-libro min-h-screen pb-24">
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-5 text-black">
        <div className="cornice mt-3 px-4 py-6 text-center">
          <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— IL TUO PROFILO —</div>
          <p className="mt-3 text-lg leading-relaxed">
            Inserisci il tuo <strong>codice personale a 8 cifre</strong> per vedere i tuoi libri e
            il tuo conto. Lo trovi nel link che ti abbiamo dato al ritiro dei libri.
          </p>
          {errore && (
            <p className="mt-3 rounded bg-red-100 p-3 text-sm text-red-700">
              Codice non valido: deve essere di 8 cifre.
            </p>
          )}
          <form action={vaiAlProfiloAction} className="mt-4 flex flex-col gap-3">
            <input
              name="codice"
              inputMode="numeric"
              pattern="[0-9]{8}"
              maxLength={8}
              placeholder="es. 12345678"
              required
              className="rounded-sm border border-[#092145]/60 bg-white/80 p-3 text-center font-mono text-2xl tracking-widest"
            />
            <button type="submit" className="ink-btn text-lg">
              Apri il mio profilo
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[#3d4c63]">
          Non hai un codice? Chiedilo a chi ha ritirato i tuoi libri.
        </p>
      </main>
      <ClientNav ebayUrl={EBAY_URL} />
    </div>
  )
}
```

- [ ] **Step 3: Build + test**

Run: `pnpm build` poi `pnpm test` — Expected: build OK, 26 test verdi.

- [ ] **Step 4: Commit**

```powershell
git add "src/app/c/[codice]/page.tsx" src/app/profilo/page.tsx
git -c commit.gpgsign=false commit -m "feat(tema): profilo come libretto del conto + ingresso codice in cornice"
```

---

## Self-Review

**Spec coverage:** §3 token → Task 1 (tutti, verbatim); §4 home B2 → Task 3 (EX LIBRIS, stemma, ❦, motto, ceralacca, fregi, capolettera, ink-btn, footer con gigli); §5 registro → Task 4 (header, sezioni ❦, righe puntinate, timbro VENDUTO, opacity, CTA); §6 libretto → Task 5 (header, cornice conto, timbri blu/verde, /profilo in cornice); §7 nav → Task 2; §8 invariati → nessun task tocca admin/manifest/logica.
**Placeholder scan:** nessuno; ogni file modificato ha il contenuto completo.
**Type consistency:** nessuna interfaccia TS cambia; `statoLabel`/fetch/azioni ricopiati identici; classi CSS del Task 1 riusate con gli stessi nomi nei task 2–5.
**Nota:** la home perde l'hero blu (deciso nei mockup): `logo.jpg` resta in public ma non è più referenziato dalla home.
