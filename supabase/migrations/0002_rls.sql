-- Attiva RLS su tutte le tabelle dati
alter table clienti enable row level security;
alter table libri enable row level security;
alter table richieste_pagamento enable row level security;
alter table impostazioni enable row level security;

-- Le tabelle sono create dal ruolo "postgres" (migrations), che nella configurazione
-- di default di Supabase NON eredita i default privileges di supabase_admin: senza
-- questi GRANT, anon/authenticated non hanno alcun SELECT e le query lato cliente
-- falliscono con "permission denied" ancora prima che le policy RLS entrino in gioco.
-- Le policy sotto restano comunque la barriera che decide QUALI righe si vedono.
grant select on clienti, libri, richieste_pagamento, impostazioni to anon, authenticated;

-- Prefisso cliente della sessione corrente (impostato dal server via set_config)
create or replace function current_cliente() returns text
language sql stable as $$
  select nullif(current_setting('app.current_cliente', true), '')
$$;

-- CLIENTI: il cliente vede solo se stesso
create policy cliente_self on clienti
  for select using (id = current_cliente());

-- LIBRI: il cliente vede solo i propri libri
create policy libri_del_cliente on libri
  for select using (cliente_id = current_cliente());

-- RICHIESTE: il cliente vede solo le proprie
create policy richieste_del_cliente on richieste_pagamento
  for select using (cliente_id = current_cliente());

-- IMPOSTAZIONI: lettura pubblica dei parametri (servono al calcolo lato cliente),
-- nessuna scrittura via anon (le scritture passano dal service-role lato admin)
create policy impostazioni_read on impostazioni
  for select using (true);
