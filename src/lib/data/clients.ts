import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { generateClientId } from '@/lib/domain/id'

export interface ClientRow {
  id: string
  nome: string
  contatti: string | null
  dati_pagamento: string | null
  note: string | null
}

export async function listClients(): Promise<ClientRow[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('clienti')
    .select('id, nome, contatti, dati_pagamento, note')
    .order('nome')
  if (error) throw new Error(`Lettura clienti fallita: ${error.message}`)
  return (data ?? []) as ClientRow[]
}

export async function getClient(id: string): Promise<ClientRow | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('clienti')
    .select('id, nome, contatti, dati_pagamento, note')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(`Lettura cliente fallita: ${error.message}`)
  return (data as ClientRow) ?? null
}

export async function createClient(input: {
  nome: string
  contatti?: string
  dati_pagamento?: string
  note?: string
}): Promise<{ id: string }> {
  const supabase = createServiceClient()
  const { data: existing, error: exErr } = await supabase.from('clienti').select('id')
  if (exErr) throw new Error(`Lettura id esistenti fallita: ${exErr.message}`)
  const taken = new Set((existing ?? []).map((r) => r.id as string))
  const id = generateClientId(Math.random, taken)

  const { error } = await supabase.from('clienti').insert({
    id,
    nome: input.nome,
    contatti: input.contatti ?? null,
    dati_pagamento: input.dati_pagamento ?? null,
    note: input.note ?? null,
  })
  if (error) throw new Error(`Creazione cliente fallita: ${error.message}`)
  return { id }
}
