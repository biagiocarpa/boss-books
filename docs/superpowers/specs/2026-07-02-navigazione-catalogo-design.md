# Fase 5 — Navigazione a 3 icone, Catalogo, Storico: Documento di Design

**Progetto:** boss-books / TrovaLibro.MO
**Data:** 2026-07-02
**Stato:** Design approvato
**Origine:** confronto con gli schizzi originali del boss (WhatsApp 2026-07-01): mancavano la
navigazione a 3 icone, la sezione "libri" come catalogo e lo storico movimenti.

---

## 1. Scopo

Allineare l'app al disegno originale del boss: dalle pagine del cliente si naviga con **tre
icone in basso** (Negozio eBay / Libri / Profilo), la sezione Libri è un **catalogo di tutti i
libri del boss** (solo dati pubblici), e il Profilo mostra anche lo **storico dei pagamenti**.

## 2. Decisioni vincolanti (confermate in chat)

- **La pagina cliente resta di sola lettura** ("cliente solo lettura al momento"): i dati di
  pagamento continuano a gestirli il boss dal pannello. Unica azione: "Richiedi pagamento"
  (invariata).
- **Il catalogo mostra solo dati pubblici stile eBay** ("i dati sono quelli di ebay, quelli che
  può prendere pubblici"): titolo e prezzo. **MAI** codici cliente, quote cliente, o qualunque
  dato del conto.

## 3. Barra di navigazione (3 icone in basso)

- Presente su **tutte le pagine sotto `/c/[codice]`** (profilo e catalogo), fissa in basso,
  stile app mobile (il pubblico è quello: link personale aperto dal telefono, PWA).
- Le tre voci, nell'ordine dello schizzo:
  1. **🛒 Negozio** → link esterno al negozio eBay (`NEXT_PUBLIC_EBAY_STORE_URL`, stesso
     default della vetrina), nuova scheda.
  2. **📚 Libri** → `/c/[codice]/libri` (catalogo).
  3. **👤 Profilo** → `/c/[codice]` (la pagina personale attuale).
- La voce attiva è evidenziata. Realizzata in un **layout di segmento**
  (`src/app/c/[codice]/layout.tsx`), così ogni pagina figlia la eredita e il codice resta
  nell'URL (nessuna sessione).
- La **vetrina pubblica `/` non cambia**: è marketing, non app; le icone appartengono
  all'esperienza del cliente col suo link.

## 4. Catalogo — `/c/[codice]/libri`

- Elenca **tutti i libri del boss** (di tutti i clienti), non solo quelli del visitatore.
- Dati mostrati per libro (solo pubblici):
  - **In vendita**: titolo + prezzo di listino, etichetta "In vendita".
  - **Venduto/Pagato**: titolo + prezzo di vendita, etichetta "Venduto" (su eBay i venduti
    sono pubblici; dà il senso che il negozio gira). Pagato e venduto sono indistinguibili
    qui: entrambi "Venduto".
  - **Reso: escluso** (l'annuncio non è più attivo né venduto).
- Ordinamento: prima gli "In vendita" (per titolo), poi i "Venduto".
- In cima: link/bottone al negozio eBay ("Compra su eBay").
- Nessun dato del visitatore in pagina (a parte la nav che porta al suo profilo).

## 5. Storico pagamenti — nel Profilo

- Nella pagina `/c/[codice]`, sotto il conto: sezione **"Pagamenti ricevuti"** con l'elenco
  delle richieste **pagate** del cliente: data di pagamento + importo, dalla più recente.
- Se vuota, la sezione non compare (o mostra "Nessun pagamento ricevuto finora").
- Corrisponde allo "STORICO MOVIMENTI" degli schizzi. I dati esistono già in
  `richieste_pagamento` (stato `pagata`, `data_pagamento`, `importo`): nessuna migration.

## 6. Modello dati / accesso

- Nessuna migration. Due letture nuove nel data layer:
  - `listCatalog()`: tutti i libri con stato ≠ 'reso', soli campi pubblici
    (titolo, stato, prezzo_listino, prezzo_vendita) — senza cliente_id in output.
  - `listPaidRequests(clienteId)`: richieste `pagata` del cliente (importo, data_pagamento).
- Come il resto del lato cliente: Server Components + service client server-only; RLS resta
  la seconda barriera. Nota: il catalogo espone dati di TUTTI i libri via service client — è
  voluto e limitato ai campi pubblici (§2).

## 7. Fuori scope

- Modifica dei dati da parte del cliente (resta sola lettura).
- Ricerca/filtri/paginazione nel catalogo (con centinaia di libri si valuterà; MVP: lista).
- Foto dei libri nel catalogo (non le abbiamo; su eBay ci sono già).
- Navigazione sulla vetrina `/` e sull'admin (restano com'è).

## 8. Note tecniche

- Branch `feature/navigazione` da `main` (tutte le PR 1–4 mergiate).
- Il layout aggiunge padding-bottom alle pagine per non far coprire i contenuti dalla barra.
- Palette invariata (beige/nero/bianco con accenti blu `#092145` e giallo `#F4BD25`).
