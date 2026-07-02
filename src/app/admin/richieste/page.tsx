import { listPendingRequests } from '@/lib/data/requests'
import { markPaidAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function RichiestePage() {
  const richieste = await listPendingRequests()
  const euro = (n: number) => `${n.toFixed(2)} €`
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Richieste in attesa ({richieste.length})</h2>
      {richieste.length === 0 && <p className="text-sm text-black/60">Nessuna richiesta in attesa.</p>}
      <ul className="flex flex-col gap-3">
        {richieste.map((r) => (
          <li key={r.id} className="rounded border border-black/20 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">
                  {r.nome} <span className="font-mono text-xs text-black/50">({r.cliente_id})</span>
                </div>
                <div className="text-sm">
                  Importo: <strong>{euro(r.importo)}</strong>
                </div>
                <div className="text-sm">Pagamento a: {r.dati_pagamento ?? '— (non inserito)'}</div>
                <div className="mt-1 text-xs text-black/50">
                  Libri: {r.libri.map((l) => l.titolo).join(', ')}
                </div>
              </div>
              <form action={markPaidAction}>
                <input type="hidden" name="id" value={r.id} />
                <button type="submit" className="bg-green-700 px-3 py-2 text-white">
                  Segna pagata
                </button>
              </form>
            </div>
            <p className="mt-2 text-xs text-black/50">
              ⚠️ Controlla il destinatario prima di pagare (il pagamento avviene fuori dall&apos;app).
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
