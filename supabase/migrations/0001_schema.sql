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
