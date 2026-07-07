# Tema "Carta & Inchiostro" — Documento di Design

**Progetto:** boss-books / TrovaLibro.MO
**Data:** 2026-07-02
**Stato:** Design approvato (mockup validati nel visual companion: B2 ornata per la home;
"Registro" per Libri; "Libretto" per Profilo — entrambi approvati)

---

## 1. Scopo

Dare il "fattore wow" a tema libro/biblioteca alle tre schermate rivolte al pubblico —
**iniziale `/`**, **Libri** (catalogo), **Profilo** (pagina cliente + inserimento codice) —
compreso lo sfondo. La schermata Negozio è eBay: fuori dal nostro controllo, non si tocca.
L'**admin resta com'è** (strumento di lavoro, niente tema).

## 2. Direzione scelta: "Carta & Inchiostro"

L'app è un **libro antico diventato app**: carta pergamena rigata come sfondo, inchiostro blu
Estense, rosso mattone per fregi e timbri, cornici da frontespizio. Tre metafore, una per
schermata:

- **Home = Frontespizio** (variante "B2 ornata"): EX LIBRIS, stemma, capolettera, ceralacca.
- **Libri = Il Registro** della biblioteca: voci su righe puntinate come un libro mastro.
- **Profilo = Il Libretto del conto**: conto in cornice, timbri PAGATO/VENDUTO.

L'ornamento pesante vive **solo sulla home**; nelle pagine funzionali comanda la leggibilità
(target 40+): carta rigata, righe puntinate, timbri — niente di più.

## 3. Vocabolario visivo (token)

| Token | Valore |
| --- | --- |
| Carta (sfondo) | `#f3e9d2` + righe orizzontali `rgba(9,33,69,.055)` ogni 26px |
| Invecchiatura | `box-shadow: inset 0 0 60px rgba(107,85,53,.3)` (solo home: .35) |
| Inchiostro | `#092145` (blu brand, già in uso) |
| Rosso mattone | `#8b3a2e` (fregi, sezioni, voce attiva nav) |
| Ceralacca | radial `#c0533f → #7b2d26` (solo home) |
| Timbro verde | `#2e5d34` (PAGATO, VENDUTO nel catalogo) |
| Timbro blu | `#092145` (VENDUTO nel profilo) |
| Barra nav | fondo carta scura `#ece0c4`, bordo sup. inchiostro; voce attiva: bordo sup. 2.5px rosso mattone + bold |
| Carattere | Georgia / Times New Roman (stack di sistema serif — zero webfont da caricare) |
| Bottoni | fondo inchiostro `#092145`, testo carta, ombra `0 2px 0 #8b3a2e` |

Implementati come **classi CSS condivise in `globals.css`** (`.parch`, `.riga`, `.timbro`,
`.ink-btn`, `.titolo-sez`, `.cornice`, `.font-libro`), usate accanto a Tailwind per il layout.
Così le tre pagine parlano la stessa lingua senza duplicare stile.

## 4. Home `/` — Frontespizio (B2 ornata, dal mockup approvato)

- Sparisce l'hero blu pieno: la pagina è **carta invecchiata**.
- **Cornice doppia** (bordo inchiostro + outline rosso offset) contenente: scritta
  "— EX LIBRIS —" (rosso, spaziata), **stemma** (`/icon-192.png`, già in public/), titolo
  "TrovaLibro.MO", giglio ❦, motto in corsivo "Ogni libro trova il suo lettore".
- **Sigillo di ceralacca "MO"** all'angolo della cornice; fregi ❝❞ agli angoli pagina.
- Paragrafo di presentazione con **capolettera rossa** (testo attuale, invariato).
- CTA "Visita il negozio eBay" = bottone inchiostro con ombra mattone.
- Footer: ❦ TrovaLibro.MO · Area admin ❦ (link admin resta).
- Barra 3 icone in tema (v. §7).

## 5. Libri — Il Registro (dal mockup approvato)

Restyling di `CatalogoView` (vale per `/libri` e `/c/[codice]/libri`):
- Intestazione centrata: "— REGISTRO DEI LIBRI —" (rosso, spaziato) + "TrovaLibro.MO",
  sottolineata da doppio bordo inchiostro.
- Sezioni "❦ IN VENDITA ❦" e "❦ VENDUTI ❦" centrate, rosse, maiuscole spaziate.
- Ogni libro = **riga di registro**: bordo inferiore puntinato, titolo a sinistra, prezzo in
  grassetto inchiostro a destra. Niente card bianche.
- Venduti: riga attenuata (opacity ~.65) + **timbro "VENDUTO"** verde inclinato.
- CTA "Compra su eBay" = bottone inchiostro.

## 6. Profilo — Il Libretto (dal mockup approvato)

Restyling di `/c/[codice]` (page.tsx):
- Intestazione: "— LIBRETTO DEL CONTO —" (rosso, spaziato), "Ciao {nome}", codice in mono.
- **Il conto in cornice doppia** (come frontespizio, senza ceralacca): righe di registro con
  Disponibile in evidenza (bold, corpo maggiore), In maturazione / In richiesta / Già pagato.
- "Richiedi pagamento" = bottone inchiostro (gating invariato).
- Sezioni "❦ I TUOI LIBRI ❦" e "❦ PAGAMENTI RICEVUTI ❦": righe di registro; stato del libro
  in corsivo piccolo, i venduti col **timbro blu "VENDUTO"** + quota; i pagamenti con
  **timbro verde "PAGATO"** + importo.
- **`/profilo` (inserisci codice)**: stessa carta + cornice doppia intorno al form; input e
  bottone in tema. Testi invariati.

## 7. Barra di navigazione (ClientNav)

- Fondo carta scura `#ece0c4`, bordo superiore inchiostro 1.5px.
- Voce attiva: bordo superiore 2.5px rosso mattone, testo bold inchiostro, fondo carta chiara.
- Etichette in serif. Icone emoji invariate (🛒📚👤).

## 8. Cosa NON cambia

- Admin: nessun tema (resta lo stile funzionale attuale).
- Logica, dati, rotte, azioni: intoccati — è un restyling puro (CSS/markup).
- PWA manifest: `theme_color`/`background_color` restano `#092145` (splash con stemma su blu
  coerente col brand). Icone invariate.
- `logo.jpg` resta in public/ (usato altrove/og in futuro); la home usa lo stemma.

## 9. Vincoli

- Zero dipendenze nuove, zero webfont (Georgia di sistema): il wow non deve costare in
  peso pagina o complessità.
- Contrasto testo/fondo da preservare (inchiostro su carta è ottimo; timbri usati su testi
  brevi in maiuscolo).
- Mobile-first; la carta rigata è un pattern CSS, non un'immagine.

## 10. Verifica

Build + 26 test invariati (nessuna logica toccata); controllo visivo sul preview Vercel della
PR (le tre schermate + barra). I mockup approvati nel companion sono il riferimento visivo
(persistiti in `.superpowers/brainstorm/1212-1783415736/content/`).
