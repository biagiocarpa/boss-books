-- service_role bypassa la RLS ma necessita comunque dei privilegi di tabella (BYPASSRLS != GRANT).
-- Le tabelle sono create dal ruolo migration, che non propaga i grant a service_role.
grant select, insert, update, delete on clienti, libri, richieste_pagamento, impostazioni to service_role;
