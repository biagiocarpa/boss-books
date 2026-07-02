# Fase 4 — Vetrina & PWA: Documento di Design

**Progetto:** boss-books (nome pubblico: **TrovaLibro.MO**)
**Data:** 2026-07-02
**Stato:** Design approvato
**Riferimento:** design principale `2026-07-01-app-conto-vendita-libri-design.md` (§3.3 vetrina, §9 PWA, §11 grafica).

---

## 1. Scopo

La faccia pubblica dell'app: una home page vetrina con logo, presentazione e link al negozio
eBay, più l'installabilità PWA (icona sulla home del telefono). Sostituisce la pagina di
default di Next e chiude l'ultima parte "strutturale" dell'MVP. Sostituisce anche l'idea di
un sito Wix separato (decisione presa nel design principale: niente lavoro doppio).

## 2. Identità (deciso dal boss)

- **Nome pubblico: TrovaLibro.MO** — usato in vetrina, titolo/metadata, icona PWA e header
  delle pagine interne (al posto di "boss-books"). Il repo resta `boss-books`.
- **Logo**: file fornito dal boss (blu scuro + giallo, stemma di Modena con motto *Avia
  Pervia*). Va copiato in `public/` come asset committato (l'originale WhatsApp è gitignored).
- **Nota legale (comunicata, non bloccante):** lo stemma è quello ufficiale del Comune di
  Modena; l'uso commerciale dell'araldica civica può richiedere autorizzazione. Il logo è un
  file sostituibile in un minuto se mai servisse cambiarlo.
- **Link negozio eBay (canonico, senza parametri di tracking):**
  `https://www.ebay.it/usr/trovalibro.mo` — letto da env `NEXT_PUBLIC_EBAY_STORE_URL` con
  questo valore come default nel codice (funziona anche senza configurare nulla su Vercel).

## 3. Vetrina (home `/`)

Sostituisce la pagina default di Next. Struttura, dall'alto:

1. **Hero blu scuro** (lo stesso blu del fondo del logo, campionato dal file, così l'immagine
   si fonde senza stacchi): logo grande centrato.
2. **Sezione presentazione** su fondo beige (`#f5f1e6`, coerente col resto dell'app):
   2-3 frasi — libri usati in conto vendita a Modena, vendita tramite eBay, trasparenza per
   chi affida i propri libri.
3. **Bottone primario giallo** "Visita il negozio eBay" → link canonico (apre in nuova scheda).
4. **Riga per i clienti**: "Hai dei libri in conto vendita? Apri il tuo link personale per
   vedere i tuoi libri e il tuo conto." (Nessun campo di input: il link glielo dà il boss.)
5. **Footer sobrio**: nome + link "Area admin" discreto → `/admin`.

Statica (nessun accesso al DB), mobile-first, caratteri grandi (target 40+).

## 4. PWA installabile

- **Manifest** (via `src/app/manifest.ts` di Next): name/short_name "TrovaLibro.MO",
  `theme_color` = blu del logo, `background_color` = blu del logo, display `standalone`,
  start_url `/`.
- **Icone** 192px e 512px generate dal logo (ritaglio quadrato dello stemma; fallback:
  logo intero su quadrato blu). PNG in `public/`.
- **Favicon** aggiornata dallo stesso ritaglio (sostituisce quella default di Next).
- **Niente service worker / offline** per ora (YAGNI): l'installabilità moderna non lo
  richiede; l'offline si aggiunge se mai servirà davvero.

## 5. Naming nelle pagine esistenti

- Metadata root (`src/app/layout.tsx`): title "TrovaLibro.MO", description breve in italiano.
- Header admin: "boss-books · Admin" → "TrovaLibro.MO · Admin".
- Pagina di login admin: "boss-books · Admin" → "TrovaLibro.MO · Admin".
- La pagina cliente `/c/[codice]` non nomina il brand nell'header (resta "Ciao {nome}") — il
  brand arriva dal titolo della scheda/metadata.

## 6. Fuori scope (YAGNI)

- Mirror del negozio eBay dentro l'app (escluso dal design principale, per sempre).
- Service worker / cache offline.
- Contenuti gestibili da pannello (i testi della vetrina sono nel codice: cambiarli è un
  commit; se il boss chiederà modifiche frequenti si valuterà più avanti).
- Domini custom / SEO avanzata.

## 7. Note tecniche

- Fase costruita **impilata su `feature/cliente`** (PR #3 ancora aperta): tocca file già
  modificati dal Piano 3 (layout admin). Branch `feature/vetrina` da `feature/cliente`.
- Nessuna migration, nessun cambiamento al DB.
- Verifica: build + controllo statico della home e del manifest; prova visiva su preview.
