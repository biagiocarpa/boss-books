# Vetrina & PWA (Fase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La home vetrina di TrovaLibro.MO (logo, presentazione, link al negozio eBay), l'installabilità PWA (manifest + icone dal logo) e il rebranding delle pagine esistenti.

**Architecture:** Pagina home statica (nessun DB), asset del logo in `public/`, manifest via `src/app/manifest.ts` (convenzione Next), icone generate una tantum con ImageMagick dal file del logo. Rebranding = soli testi in layout admin e login.

**Tech Stack:** Next.js 16 (App Router, `manifest.ts`, `next/image`), Tailwind v4, ImageMagick 7 (`magick`, già installato) per le icone. Nessuna dipendenza nuova.

## Global Constraints

- Branch: `feature/vetrina` (impilato su `feature/cliente`). pnpm; lingua UI italiano.
- **Nome pubblico: TrovaLibro.MO** (repo resta boss-books).
- **Colori dal logo (campionati, non stimati):** blu `#092145`, giallo `#F4BD25`; beige app `#f5f1e6`.
- **Link eBay canonico:** `https://www.ebay.it/usr/trovalibro.mo` — letto da `NEXT_PUBLIC_EBAY_STORE_URL` con questo default nel codice.
- Il logo sorgente è `WhatsApp Image 2026-07-02 at 13.43.15.jpeg` nella root (GITIGNORED): la copia in `public/` va committata; l'originale resta fuori da git.
- Nessuna migration, nessun accesso DB dalla home. Niente service worker.
- Mobile-first, caratteri grandi (target 40+).

---

### Task 1: Asset — logo in public/ + icone PWA + favicon

**Files:**
- Create: `public/logo.jpg` (copia del logo)
- Create: `public/icon-192.png`, `public/icon-512.png` (ritaglio quadrato dello stemma)
- Modify: `src/app/favicon.ico` (sostituzione con favicon dal ritaglio)

**Interfaces:**
- Consumes: `WhatsApp Image 2026-07-02 at 13.43.15.jpeg` (root, gitignored), ImageMagick 7.
- Produces: i 4 asset usati da Task 2 (manifest/icone) e Task 3 (hero `/logo.jpg`).

- [ ] **Step 1: Copiare il logo**

```powershell
Copy-Item "WhatsApp Image 2026-07-02 at 13.43.15.jpeg" "public\logo.jpg"
```

- [ ] **Step 2: Generare il ritaglio quadrato dello stemma e le icone**

Lo stemma è centrato orizzontalmente nella metà alta (bounding box ≈ x 704–1316, y 31–699 su 2048×1152). Ritaglio quadrato 700×700 con margine blu:

```powershell
magick "public\logo.jpg" -crop 700x700+660+10 +repage -resize 512x512 "public\icon-512.png"
magick "public\icon-512.png" -resize 192x192 "public\icon-192.png"
```

- [ ] **Step 3: Verificare visivamente il ritaglio**

Aprire/leggere `public/icon-512.png` (tool Read): deve mostrare lo **stemma intero** (corona compresa) centrato su fondo blu, senza tagli brutti. Se la corona o i rami sono tagliati, aggiustare offset/size del crop (es. `-crop 760x760+630+0`) e rigenerare finché è pulito.

- [ ] **Step 4: Generare la favicon**

```powershell
magick "public\icon-192.png" -define icon:auto-resize=16,32,48 "src\app\favicon.ico"
```

- [ ] **Step 5: Verificare che gli asset esistano e che l'originale resti fuori da git**

```powershell
Get-ChildItem public\logo.jpg, public\icon-192.png, public\icon-512.png, src\app\favicon.ico
git status --porcelain
```
Expected: i 4 file presenti; in `git status` compaiono solo loro (nessun `WhatsApp Image*.jpeg`).

- [ ] **Step 6: Commit**

```powershell
git add public/logo.jpg public/icon-192.png public/icon-512.png src/app/favicon.ico
git -c commit.gpgsign=false commit -m "feat(vetrina): asset logo TrovaLibro.MO + icone PWA + favicon"
```

---

### Task 2: Manifest PWA + metadata root

**Files:**
- Create: `src/app/manifest.ts`
- Modify: `src/app/layout.tsx` (solo il blocco `metadata`)

**Interfaces:**
- Consumes: icone del Task 1.
- Produces: manifest servito su `/manifest.webmanifest` (Next lo collega da solo); titolo/description brand.

- [ ] **Step 1: Creare il manifest**

Create `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrovaLibro.MO',
    short_name: 'TrovaLibro.MO',
    description:
      'Libri usati in conto vendita a Modena — segui lo stato dei tuoi libri e il tuo conto.',
    start_url: '/',
    display: 'standalone',
    background_color: '#092145',
    theme_color: '#092145',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
```

- [ ] **Step 2: Aggiornare i metadata root**

In `src/app/layout.tsx`, sostituire il valore dell'`export const metadata` esistente con:

```ts
export const metadata: Metadata = {
  title: 'TrovaLibro.MO',
  description: 'Libri usati in conto vendita a Modena — segui i tuoi libri e il tuo conto.',
}
```

(Lasciare invariato tutto il resto del file: font, html/body, ecc.)

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: OK; nella lista rotte compare `○ /manifest.webmanifest`.

- [ ] **Step 4: Commit**

```powershell
git add src/app/manifest.ts src/app/layout.tsx
git -c commit.gpgsign=false commit -m "feat(pwa): manifest TrovaLibro.MO + metadata"
```

---

### Task 3: Home vetrina

**Files:**
- Modify: `src/app/page.tsx` (riscrittura completa: via il boilerplate Next)
- Modify: `.env.local.example` (documentare la variabile eBay)

**Interfaces:**
- Consumes: `/logo.jpg` (Task 1); `NEXT_PUBLIC_EBAY_STORE_URL` (opzionale, default nel codice).
- Produces: la home pubblica.

- [ ] **Step 1: Riscrivere `src/app/page.tsx`**

Contenuto completo del file:

```tsx
import Image from 'next/image'

const EBAY_URL = process.env.NEXT_PUBLIC_EBAY_STORE_URL ?? 'https://www.ebay.it/usr/trovalibro.mo'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f1e6] text-black">
      <section className="bg-[#092145] px-5 py-10">
        <Image
          src="/logo.jpg"
          alt="TrovaLibro.MO"
          width={1024}
          height={576}
          priority
          className="mx-auto w-full max-w-lg"
        />
      </section>

      <section className="mx-auto flex max-w-xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Libri usati in conto vendita, a Modena</h1>
        <p className="text-lg leading-relaxed">
          Affidaci i tuoi libri: li mettiamo in vendita sul nostro negozio eBay e tu segui tutto
          dal telefono — lo stato di ogni libro e quanto ti spetta, in ogni momento.
        </p>
        <a
          href={EBAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-[#F4BD25] p-4 text-center text-lg font-semibold"
        >
          Visita il negozio eBay
        </a>
        <p className="text-sm text-black/70">
          Hai dei libri in conto vendita con noi? Apri il tuo <strong>link personale</strong> per
          vedere i tuoi libri e il tuo conto. Se non lo hai ancora, chiedilo a chi ha ritirato i
          tuoi libri.
        </p>
      </section>

      <footer className="mx-auto max-w-xl p-6 text-xs text-black/50">
        TrovaLibro.MO ·{' '}
        <a href="/admin" className="underline">
          Area admin
        </a>
      </footer>
    </main>
  )
}
```

- [ ] **Step 2: Documentare la variabile in `.env.local.example`**

Aggiungere in fondo:

```
# Link al negozio eBay mostrato in vetrina (opzionale: default nel codice)
NEXT_PUBLIC_EBAY_STORE_URL=https://www.ebay.it/usr/trovalibro.mo
```

- [ ] **Step 3: Build**

Run: `pnpm build`
Expected: OK; `/` risulta statica (`○`).

- [ ] **Step 4: Commit**

```powershell
git add src/app/page.tsx .env.local.example
git -c commit.gpgsign=false commit -m "feat(vetrina): home TrovaLibro.MO (hero, presentazione, link eBay)"
```

---

### Task 4: Rebranding pagine esistenti

**Files:**
- Modify: `src/app/admin/layout.tsx` (header)
- Modify: `src/app/admin/login/page.tsx` (titolo)

**Interfaces:**
- Consumes: nulla.
- Produces: brand coerente ovunque.

- [ ] **Step 1: Header admin**

In `src/app/admin/layout.tsx`: `boss-books · Admin` → `TrovaLibro.MO · Admin`.

- [ ] **Step 2: Titolo login**

In `src/app/admin/login/page.tsx`: `boss-books · Admin` → `TrovaLibro.MO · Admin`.

- [ ] **Step 3: Controllo residui**

```powershell
Select-String -Path src -Pattern "boss-books" -Recurse
```
Expected: nessun match dentro `src/` (il nome resta solo in package.json/README/docs, che vanno bene così).

- [ ] **Step 4: Build + test**

Run: `pnpm build` poi `pnpm test`
Expected: build OK, 26 test verdi.

- [ ] **Step 5: Commit**

```powershell
git add src/app/admin/layout.tsx src/app/admin/login/page.tsx
git -c commit.gpgsign=false commit -m "feat(brand): TrovaLibro.MO nelle pagine admin"
```

---

## Self-Review

**Spec coverage:** §2 identità → Task 1 (asset) + Task 4 (rebranding); §3 vetrina → Task 3 (tutti e 5 gli elementi: hero, presentazione, bottone, riga clienti, footer); §4 PWA → Task 1 (icone) + Task 2 (manifest, niente SW); §5 naming → Task 2 (metadata) + Task 4. Fuori scope rispettato.

**Placeholder scan:** nessuno; colori e URL sono valori campionati/canonici reali.

**Type consistency:** `manifest.ts` usa la convenzione `MetadataRoute.Manifest` di Next; nessuna interfaccia condivisa tra task oltre ai file asset.

**Nota:** la verifica visiva vera (icona installata, resa del logo) si fa sul preview Vercel della PR — il piano verifica build, crop dell'icona (Read dell'immagine) e assenza di regressioni (26 test).
