# Piano 3 — Lato Cliente & Incasso: Documento di Design

**Progetto:** boss-books
**Data:** 2026-07-02
**Stato:** Design approvato
**Riferimento:** estende/concretizza il design principale
`docs/superpowers/specs/2026-07-01-app-conto-vendita-libri-design.md` (§3.1, §4, §7, §8, §8.1).

---

## 1. Scopo

Costruire la metà "del cliente" dell'app: chi ha dato i libri in conto vendita apre un link
personale, vede lo stato dei suoi libri e il suo saldo, e può richiedere il pagamento. Lato
admin si aggiunge la gestione delle richieste (incasso). È la funzione-garanzia che dà senso
all'intera app (spec §1).

---

## 2. Accesso cliente — link personale (deciso)

- Il cliente accede tramite **link personale**: `boss-books.vercel.app/c/<8cifre>` dove `<8cifre>`
  è il suo `clienti.id`. **Il link È la credenziale**: nessun login, nessuna password, nessuna
  sessione/cookie. Il cliente lo salva tra i preferiti / sulla home.
- La rotta `/c/[codice]` è un **Server Component** che legge il codice dall'URL e interroga il DB
  **filtrando per quel codice** (service client lato server — mai nel browser). Le policy RLS del
  Piano 1 restano come **seconda barriera**.
- Modello di fiducia (già accettato, spec §5): 8 cifre casuali, dati di conto vendita locale non
  sensibili. Chi ha il link vede quei dati; rischio accettabile.
- Se il codice non esiste → pagina "cliente non trovato" (non un 500).

## 3. Pagine cliente — sola lettura (+ 1 azione)

La pagina cliente è **di sola lettura**, con un'unica azione (richiesta pagamento). I dati di
pagamento (PayPal/IBAN) **li inserisce il boss** dal pannello admin (campo `clienti.dati_pagamento`
già esistente) — il cliente NON li modifica (niente scrittura di dati sensibili da un link aperto).

Contenuti:
- **Intestazione**: `clienti.nome` + il codice in piccolo.
- **Lista dei suoi libri**: titolo + **stato leggibile**:
  - `in_vendita` → "In vendita"
  - `venduto` non ancora maturato → "Venduto — in maturazione (fino al GG/MM)"
  - `venduto` maturato → "Disponibile"
  - `pagato` → "Pagato"
  - `reso` → "Reso"
  con la **quota cliente** mostrata dove valorizzata.
- **Il suo conto** (tre totali, da `computeBalance` del Piano 1):
  - **Disponibile** = quote di libri maturati e non ancora incassati (né in una richiesta in corso).
  - **In maturazione** = venduti ancora nei 30 giorni.
  - **Già pagato** = storico incassato.

Nota sul "Disponibile" e le richieste in corso: un libro maturato che è già **agganciato a una
richiesta in attesa** non deve ricomparire come "Disponibile" (altrimenti lo si richiederebbe due
volte). Vedi §4.

## 4. Richiesta di pagamento

- Pulsante **"Richiedi pagamento"** nella pagina cliente.
- **Attivo solo se**: Disponibile ≥ `minimo_prelievo` **E** non esiste già una richiesta
  `richiesta` (in attesa) per quel cliente (**una richiesta alla volta**). Altrimenti è disabilitato
  con spiegazione ("sotto il minimo di X€" / "hai già una richiesta in lavorazione").
- Alla pressione (server action, filtrata per codice):
  1. calcola l'insieme dei libri **maturati e non ancora in una richiesta** (stato `venduto`,
     maturati, `richiesta_id IS NULL`);
  2. crea una riga `richieste_pagamento` (stato `richiesta`, `importo` = somma delle loro quote);
  3. **aggancia** quei libri alla richiesta (`libri.richiesta_id = <id>`).
- Effetto: quei libri risultano "impegnati" → escono dal Disponibile finché la richiesta non è
  evasa. (Regola anti-doppio-conteggio §8.1: il saldo si deriva dallo stato dei libri + aggancio,
  mai sottraendo l'`importo` della richiesta.)
- La pagina mostra "Richiesta inviata, in lavorazione" con l'importo.

**Definizione operativa di "Disponibile" (aggiornata):** quota dei libri `venduto`, maturati,
con `richiesta_id IS NULL`. I libri agganciati a una richiesta in attesa sono "in richiesta",
non più disponibili.

## 5. Lato admin — gestione richieste (incasso)

Nuova sezione admin **"Richieste"** (`/admin/richieste`):
- Elenco delle richieste in stato `richiesta` (in attesa), ciascuna con: nome cliente, importo,
  **dati di pagamento del cliente ben visibili**, data richiesta, e i libri agganciati.
- Azione **"Segna pagata"**: imposta `richieste_pagamento.stato = 'pagata'` + `data_pagamento`,
  e porta i **libri agganciati** a `stato = 'pagato'`. (Coerente col CHECK 0003: i libri erano
  `venduto` coi campi di vendita valorizzati → passano a `pagato` mantenendoli.)
- Le richieste `pagata` finiscono nello **storico**.
- **Promemoria operativo in UI**: prima di "Segna pagata", controllare il destinatario del
  pagamento (il boss paga fuori dall'app).

**Guardia:** "Segna pagata" deve agire solo su una richiesta ancora `richiesta` (no doppio incasso)
e deve lanciare se non aggiorna righe (come i guard del Piano 2).

## 6. Notifica al boss — email (deciso)

All'atto della **creazione** di una richiesta, invio di un'**email al boss** (Resend):
- Destinatario: l'email del boss (config).
- Contenuto: nome cliente, importo richiesto, dati di pagamento, link alla sezione richieste.
- Se l'invio email fallisce, **la richiesta resta comunque registrata** (l'email è un di più, non
  deve far fallire l'operazione): errore email loggato, non propagato all'utente.
- Config: `RESEND_API_KEY` + mittente (dominio verificato o mittente di test Resend) +
  `BOSS_NOTIFY_EMAIL`. Variabili d'ambiente, mai hardcoded.

## 7. Correzione UI "Reso" (dal Piano 2)

Nel dettaglio cliente dell'admin, l'azione **"Reso"** va spostata dai libri `in_vendita` ai libri
**`venduto`** (in maturazione), come deciso (spec §4): il reso è il compratore che restituisce un
libro venduto durante i 30 giorni. Il data layer (`markReturned`) già ammette `venduto`; è una
modifica alla UI del Task 8.

## 8. Modello dati (nessuna nuova tabella)

Si riusa lo schema esistente:
- `richieste_pagamento` (già presente): `stato` `richiesta`→`pagata`, `importo`, `data_richiesta`,
  `data_pagamento`.
- `libri.richiesta_id` (già presente, Piano 2): aggancio libro→richiesta.
- Serve il **grant di scrittura** al percorso cliente: la richiesta di pagamento scrive
  `richieste_pagamento` e aggiorna `libri`. Le scritture passano dal **service client lato server**
  nella server action `/c/[codice]`, filtrate per codice — quindi i grant service_role del Piano 2
  bastano; non serve dare INSERT/UPDATE ad anon.

## 9. Stack / note

- Stesse tecnologie del Piano 2 (Next 16 App Router, Supabase, Server Actions, service client
  server-only). Aggiunta: `resend` (client email).
- Denaro sempre via il motore del Piano 1 (`computeBalance`, quote già calcolate); mai ricalcolare
  a mano lato cliente.
- Palette nero/bianco/beige, mobile-first, caratteri grandi e stati evidenziati con etichette
  chiare (target 40+).

## 10. Cosa resta fuori (YAGNI / fasi successive)

- Pagamenti parziali (il cliente incassa sempre l'intero disponibile).
- Notifiche push / PWA push.
- Pagamento diretto via PayPal Payouts (fase 2).
- Storno di un libro `pagato` (reso dopo il pagamento) — fuori scope: la maturazione a 30gg è
  progettata proprio per pagare solo a finestra resi chiusa.
- Modifica dei dati di pagamento da parte del cliente (li mette il boss).

## 11. Questioni aperte (non bloccanti)

- Mittente email Resend: dominio verificato vs mittente di test — si decide in fase di config.
- Testo/estetica esatti delle etichette di stato: si rifiniscono in corso d'opera.
