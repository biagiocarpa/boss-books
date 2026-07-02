-- Aggancio libro → richiesta di pagamento che lo incassa (valorizzato in Piano 3)
alter table libri add column richiesta_id uuid references richieste_pagamento(id);
create index libri_richiesta_idx on libri(richiesta_id);

-- Un libro venduto/pagato DEVE avere prezzo_vendita, data_vendita e quota_cliente;
-- un libro non ancora venduto NON deve averli.
alter table libri add constraint libri_campi_vendita_coerenti check (
  (stato in ('venduto','pagato')
     and prezzo_vendita is not null and data_vendita is not null and quota_cliente is not null)
  or
  (stato in ('in_vendita','reso')
     and prezzo_vendita is null and data_vendita is null and quota_cliente is null)
);
