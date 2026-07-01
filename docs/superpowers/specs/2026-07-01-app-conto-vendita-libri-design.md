# App Conto Vendita Libri — Documento di Design

**Nome:** boss-books
**Data:** 2026-07-01
**Stato:** Design approvato (in attesa di review finale della spec)
**Autore:** Biagio Carpaneto (dev) — per conto del committente ("il boss")

---

## 1. Scopo e contesto

Il boss gestisce un **conto vendita di libri**: clienti locali gli consegnano libri di persona,
lui li mette in vendita su eBay col proprio negozio, e quando un libro vende trattiene una
percentuale e il resto spetta al cliente.

Oggi il cliente, per sapere lo stato dei suoi libri, deve o fidarsi della parola del boss,
o cercare a mano gli annunci su eBay, oppure il boss deve chiamarlo periodicamente.
Con 10 clienti è gestibile; con 100 libri diventa insostenibile.

**L'app è, prima di tutto, uno strumento di garanzia e trasparenza:** il cliente apre l'app
e vede in autonomia lo stato di ogni suo libro e quanti soldi gli spettano, senza telefonate
e senza cercare su eBay. La possibilità di richiedere il pagamento chiude il cerchio.

L'app resta **parallela e complementare a eBay**, non lo sostituisce: comprare i libri si fa
sempre su eBay. L'app non aggiunge nulla al processo d'acquisto — aggiunge trasparenza sul
conto vendita.

**Target utenti:** clienti adulti, prevalentemente 40+, locali (Modena e zona), poca
dimestichezza tecnica. Da qui la scelta di ridurre al minimo ogni attrito d'accesso.

---

## 2. Principio guida (cosa NON costruiamo — YAGNI)

Lo stesso committente ha riconosciuto che il "negozio eBay dentro l'app" è fatica inutile per
la funzione core. Vengono quindi **esplicitamente esclusi dall'MVP** (fase 2 o mai):

- Copia/mirror del negozio eBay dentro l'app.
- Acquisti dentro l'app.
- **Pagamento automatico** verso il cliente (l'MVP registra solo richiesta e "pagato").
- **Sincronizzazione automatica con eBay** (l'MVP aggiorna lo stato dei libri a mano).
- Notifiche push native / pubblicazione sugli app store.
- Registrazione cliente con email/password.

Ognuna di queste è predisposta a livello di dati ma non implementata ora.

---

## 3. I tre attori ("le tre porte")

### 3.1 Cliente
Chi ha consegnato i libri. Entra con il proprio **codice a 8 cifre** (vedi §5). Può:
- vedere **solo** i propri libri e lo stato di ognuno;
- vedere il proprio **conto** (disponibile / in maturazione / già pagato);
- salvare **una volta** i propri dati di pagamento (PayPal/IBAN) nel profilo;
- premere **"Richiedi pagamento"** quando il disponibile ≥ soglia minima.

Non può modificare nulla. Sola lettura + richiesta pagamento.

### 3.2 Admin (il boss + collaboratori)
Accesso con **credenziali condivise** (login classico), che il boss può passare a un
collaboratore per delegare l'inserimento libri. Può:
- creare/modificare clienti e libri;
- segnare un libro come **venduto** (inserendo il prezzo di vendita) o **reso/annullato**;
- gestire le **richieste di pagamento** (le vede con i dati di pagamento del cliente già
  compilati) e segnarle come **pagate**;
- modificare le **impostazioni** (§6).

Ruoli fini (permessi differenziati) **non** previsti nell'MVP: accesso admin unico e condiviso.

### 3.3 Vetrina (pubblica)
Pagina pubblica con logo, breve presentazione e link al negozio eBay. È la parte "estetica".
**Sostituisce** l'eventuale sito Wix — non lo si affianca (niente lavoro doppio).

---

## 4. Ciclo di vita di un libro

```
Inserito → In vendita → Venduto → In maturazione (30 gg) → Disponibile → Pagato
                             └──────────→ Reso / Annullato (importo rimosso dal conto)
```

- **Inserito / In vendita**: l'admin ha registrato il libro (titolo, prezzo, codice); è
  online su eBay. Nessun importo a conto.
- **Venduto**: l'admin registra la vendita col prezzo finale. L'importo spettante al cliente
  viene calcolato (§7) ed entra **in maturazione**.
- **In maturazione (30 gg dalla vendita)**: l'importo è visibile al cliente ma **non ancora
  prelevabile**. Copre il periodo di reso (max 14 gg) più i tempi di spedizione/incasso.
- **Disponibile**: passati i 30 gg, l'importo diventa prelevabile e concorre al saldo
  richiedibile.
- **Reso / Annullato**: il compratore ha reso il libro (o l'annuncio è annullato). L'importo
  esce dal conto del cliente. Ammesso solo mentre il libro è in maturazione.
- **Pagato**: l'importo è stato liquidato al cliente e finisce nello **storico movimenti**.

La trasparenza di questo ciclo **è** la garanzia che l'app promette: il cliente vede sempre in
che stato è ogni suo libro e perché il suo saldo è quello che è.

---

## 5. Identità e schema dei codici

Lo schema unifica l'identità del cliente e il codice prodotto eBay usando **la stessa chiave**,
così il passaggio futuro all'API eBay non richiede rifacimenti.

- **Cliente** = **8 cifre casuali** (NON sequenziali). Casuali per due motivi: (1) fanno anche
  da chiave d'accesso debole ma sufficiente per dati di conto vendita locale non sensibili;
  (2) evitano che un cliente indovini il codice del vicino.
- **Libro** = prefisso cliente (8 cifre) + suffisso libro. Il codice completo va nel campo
  **"Codice prodotto personalizzato" (SKU)** dell'annuncio eBay.
- **Generazione automatica**: nel pannello admin si sceglie il cliente e il sistema compone e
  incrementa da solo il codice del libro. L'operatore scrive **solo titolo e prezzo**.
  Nessuno digita codici lunghi a mano.
- **Modificabile**: il codice di un singolo libro resta correggibile a mano (errori,
  riassegnazione di un libro a un altro cliente).

**Accesso cliente:** inserisce le sue 8 cifre una volta; da lì vede sempre e solo i libri il
cui SKU inizia con quel prefisso. Nessuna email, nessuna password.

**Predisposizione API eBay (fase 2):** lo stesso prefisso permetterà di chiedere a eBay "tutti
gli annunci il cui SKU inizia con `XXXXXXXX`" e ottenere la lista del cliente in automatico.

---

## 6. Impostazioni configurabili (dal pannello, mai nel codice)

Tutti questi parametri sono in tuning e cambieranno; devono essere modificabili dall'admin
senza toccare il codice:

| Parametro                 | Default indicativo | Note                                             |
| ------------------------- | ------------------ | ------------------------------------------------ |
| Commissione eBay          | ~5%                | Sottratta dal prezzo per ottenere il netto        |
| Scaglioni di prezzo + %   | da definire        | % trattenuta dal boss per fascia di prezzo libro  |
| Giorni di maturazione     | 30                 | Dalla data di vendita                             |
| Soglia minima di prelievo | 20–30 €            | Il cliente non può richiedere sotto questa cifra  |

Gli **scaglioni**: la % trattenuta dal boss dipende dal prezzo del **singolo** libro
(≈60% sui libri economici, in calo verso 40/30% sui libri costosi). NON dipende dal totale
accumulato dal cliente. Le soglie e le percentuali esatte le definisce il boss.

---

## 7. Calcolo del conto

Per ogni libro venduto:

```
netto      = prezzo_vendita − (prezzo_vendita × commissione_eBay)      # spedizione ESCLUSA
quota_boss = netto × percentuale_scaglione(prezzo_vendita)
quota_cliente = netto − quota_boss
```

La **spedizione non entra** mai nel calcolo. Lo scaglione è scelto in base al prezzo di vendita
del singolo libro.

**Esempi** (percentuali illustrative, quelle vere le imposta il boss):

| Prezzo vendita | −5% eBay | Netto  | % boss | Quota boss | Quota cliente |
| -------------- | -------- | ------ | ------ | ---------- | ------------- |
| 10 €           | 0,50 €   | 9,50 € | 60%    | 5,70 €     | **3,80 €**    |
| 100 €          | 5,00 €   | 95,00 €| 30%    | 28,50 €    | **66,50 €**   |

Il conto del cliente mostra tre totali:
- **Disponibile** = somma quote di libri **maturati** − quanto già pagato → è la cifra richiedibile.
- **In maturazione** = quote di libri venduti ancora nei 30 gg.
- **Già pagato** = storico dei pagamenti liquidati.

---

## 8. Flusso di pagamento (MVP manuale)

1. Il cliente ha salvato in profilo i propri dati di pagamento (PayPal/IBAN) — **una volta**.
2. Quando **Disponibile ≥ soglia minima**, può premere **"Richiedi pagamento"**.
3. All'admin arriva la richiesta **con i dati di pagamento del cliente già compilati**
   (non vanno richiesti ogni volta).
4. Il boss paga **fuori dall'app** (PayPal, bonifico, ecc.), con i suoi tempi (la maturazione
   garantisce che i soldi ci siano).
5. Il boss segna la richiesta come **"pagata"** → i libri agganciati a quella richiesta passano
   a stato `pagato` → il disponibile si ricalcola da solo (quei libri non contano più) → la
   richiesta resta nello **storico**.

### 8.1 Regola anti-doppio-conteggio (vincolante)

Il saldo si calcola da **una sola fonte: lo stato dei libri**. La tabella `richieste_pagamento`
è **solo storico/workflow** e **non entra mai** nel calcolo del saldo.

- Alla richiesta, la riga `richieste_pagamento` **si aggancia ai libri specifici** che sta
  incassando (quelli maturati e non ancora `pagato` in quel momento).
- Alla marcatura "pagata", quei libri passano a `pagato`.
- **Disponibile = somma quote dei libri maturati con stato ≠ `pagato`.** L'`importo` scritto
  nella richiesta serve solo a sapere quanto pagare e per lo storico — non si sottrae una
  seconda volta.

Motivo: unica verità = stato del libro → impossibile contare due volte per costruzione, e ogni
libro racconta la sua storia fino a `pagato` (è la trasparenza libro-per-libro che è il senso
dell'app).

**Niente pagamenti parziali nell'MVP:** il cliente incassa sempre l'intero disponibile in un
colpo, non una parte. (Da confermare col boss; se un giorno servirà, si rivede.)

**Fase 2:** integrazione **PayPal Payouts** per liquidare con un click a partire dalla notifica
di richiesta (pagamento sempre avviato dal boss, non automatico).

---

## 9. Stack tecnologico

Riciclato dal progetto `ibar` (stesso autore, stessa città, stessa natura PWA), rimuovendo le
parti mappa/POI non pertinenti.

| Layer           | Scelta                                          |
| --------------- | ----------------------------------------------- |
| Frontend        | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling         | Tailwind CSS v4 (+ shadcn/ui quando serve)      |
| Backend         | Supabase (Postgres + Auth + Storage)            |
| Region Supabase | eu-west-1 (Frankfurt) — vincolo GDPR            |
| Email/notifiche | Resend (transactional)                          |
| Hosting         | Vercel (frontend) + Supabase Cloud (backend)    |
| Package manager | pnpm                                            |
| Node            | 22 LTS o superiore                              |

**Non riciclato da `ibar`:** MapLibre GL JS, tiles OpenFreeMap, Overpass/OpenStreetMap — qui
non servono.

**PWA:** l'app si "installa" come icona sulla home del telefono senza passare dagli app store;
lettura del proprio conto disponibile anche con connessione debole.

**Note su Supabase Auth per i due tipi di accesso:**
- **Admin**: autenticazione Supabase standard (credenziali condivise).
- **Cliente**: accesso tramite codice a 8 cifre (non è un utente email/password). Va modellato
  come sessione leggera legata al prefisso cliente; le policy di riga (RLS) devono garantire
  che una sessione cliente veda **solo** i libri col proprio prefisso. Questo è il punto di
  sicurezza più delicato dell'MVP e va trattato con cura nel piano.

---

## 10. Modello dati (bozza)

- **clienti**: `id` (8 cifre casuali, chiave), nome, contatti, dati_pagamento (PayPal/IBAN), note.
- **libri**: `sku` (prefisso cliente + suffisso), `cliente_id`, titolo, prezzo_listino, stato
  (`in_vendita` | `venduto` | `reso` | `pagato`), prezzo_vendita, data_vendita, quota_cliente,
  `richiesta_id` (FK → richieste_pagamento, valorizzato quando il libro viene incassato).
  Nota: **maturato/disponibile NON sono stati salvati** — si derivano a runtime da
  `data_vendita` + giorni di maturazione (vedi `computeBalance`).
- **richieste_pagamento**: `id`, `cliente_id`, importo, stato (`richiesta` | `pagata`),
  data_richiesta, data_pagamento. I libri incassati la referenziano via `libri.richiesta_id`
  (vedi §8.1). L'`importo` è storico, non è input del calcolo del saldo.
- **impostazioni**: commissione_ebay, scaglioni (lista fascia→%), giorni_maturazione,
  soglia_minima_prelievo.

(Il modello definitivo, con vincoli e RLS, si fissa nel piano di implementazione.)

---

## 11. Direzione grafica

- Palette **nero / bianco / beige**: taglio "bacheca di vendita / marketplace", sobrio e
  leggibile. Il beige come sfondo caldo (tipo carta/bacheca), nero per testo e struttura,
  bianco per le schede dei libri.
- Mobile-first, interfaccia semplice e a caratteri leggibili (target 40+): schede libro grandi,
  stato del libro evidenziato con etichette chiare più che con colori accesi.
- Il logo del boss resta l'elemento di identità nella vetrina; la palette app gli sta neutra
  intorno.
- Non bloccante per l'MVP funzionale; si rifinisce in corso d'opera.

---

## 12. Questioni aperte (non bloccanti per iniziare)

- **Nome dell'app**: deciso → **boss-books**. Naming delle singole sezioni/etichette UI: ancora da rifinire.
- **Scaglioni di prezzo esatti** e relative percentuali: il boss li sta tarando; l'app li rende
  configurabili, quindi non bloccano lo sviluppo.
- Se in futuro serva una % personalizzata per singolo cliente (oltre agli scaglioni per prezzo):
  al momento **no**, la % dipende solo dal prezzo del libro.

---

## 13. Roadmap in fasi

- **Fase 1 (MVP):** tre porte, ciclo di vita libro, calcolo conto, pagamento manuale con dati
  salvati, codici auto-generati, impostazioni configurabili, vetrina base. Aggiornamento libri
  **manuale**.
- **Fase 2:** sincronizzazione automatica con **API eBay** (per SKU), pagamento diretto via
  **PayPal Payouts**, eventuali notifiche.
- **Fase 3 (eventuale):** parte "vetrina/negozio" più ricca, espansione oltre la clientela locale.
