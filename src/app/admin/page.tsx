import { listClients } from '@/lib/data/clients'
import { createClientAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function ClientiPage() {
  const clienti = await listClients()
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Nuovo cliente</h2>
        <form action={createClientAction} className="flex flex-wrap gap-2">
          <input name="nome" placeholder="Nome" required className="border p-2" />
          <input name="contatti" placeholder="Contatti" className="border p-2" />
          <input name="dati_pagamento" placeholder="PayPal / IBAN" className="border p-2" />
          <input name="note" placeholder="Note" className="border p-2" />
          <button type="submit" className="bg-black px-3 text-white">Crea</button>
        </form>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Clienti ({clienti.length})</h2>
        <ul className="flex flex-col gap-1">
          {clienti.map((c) => (
            <li key={c.id} className="flex gap-3 border-b border-black/10 py-1">
              <a href={`/admin/clienti/${c.id}`} className="font-mono">{c.id}</a>
              <span>{c.nome}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
