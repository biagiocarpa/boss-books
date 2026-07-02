import { notFound } from 'next/navigation'
import { getClientDashboard } from '@/lib/data/client-view'
import { listPaidRequests } from '@/lib/data/requests'
import { requestPaymentAction } from './actions'

export const dynamic = 'force-dynamic'

function statoLabel(l: { stato: string; inPendingRequest: boolean }): string {
  if (l.stato === 'in_vendita') return 'In vendita'
  if (l.stato === 'reso') return 'Reso'
  if (l.stato === 'pagato') return 'Pagato'
  if (l.stato === 'venduto') return l.inPendingRequest ? 'Venduto — in richiesta' : 'Venduto'
  return l.stato
}

export default async function ClientePage({ params }: { params: Promise<{ codice: string }> }) {
  const { codice } = await params
  const dash = await getClientDashboard(codice)
  if (!dash) notFound()

  const { cliente, libri, balance, pending } = dash
  const pagamenti = await listPaidRequests(codice)
  const euro = (n: number) => `${n.toFixed(2)} €`

  return (
    <main className="mx-auto max-w-xl p-5 text-black">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Ciao {cliente.nome}</h1>
        <p className="font-mono text-xs text-black/50">codice {cliente.id}</p>
      </header>

      <section className="mb-6 rounded border border-black/20 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Il tuo conto</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span>Disponibile</span>
          <span className="text-right font-semibold">{euro(balance.available)}</span>
          <span>In maturazione</span>
          <span className="text-right">{euro(balance.maturing)}</span>
          <span>In richiesta</span>
          <span className="text-right">{euro(balance.requested)}</span>
          <span>Già pagato</span>
          <span className="text-right">{euro(balance.paid)}</span>
        </div>

        <div className="mt-4">
          {pending ? (
            <p className="rounded bg-black/5 p-3 text-sm">
              Richiesta di {euro(pending.importo)} inviata, in lavorazione.
            </p>
          ) : balance.available > 0 ? (
            <form action={requestPaymentAction.bind(null, cliente.id)}>
              <button type="submit" className="w-full bg-black p-3 text-white">
                Richiedi pagamento ({euro(balance.available)})
              </button>
            </form>
          ) : (
            <p className="text-sm text-black/60">Nessun importo disponibile da richiedere.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">I tuoi libri ({libri.length})</h2>
        <ul className="flex flex-col gap-2">
          {libri.map((l) => (
            <li
              key={l.sku}
              className="flex items-center justify-between rounded border border-black/10 bg-white p-3"
            >
              <div>
                <div>{l.titolo}</div>
                <div className="text-xs text-black/50">{statoLabel(l)}</div>
              </div>
              {l.quota_cliente != null && <div className="font-semibold">{euro(l.quota_cliente)}</div>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold">Pagamenti ricevuti</h2>
        {pagamenti.length === 0 ? (
          <p className="text-sm text-black/60">Nessun pagamento ricevuto finora.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pagamenti.map((p, i) => (
              <li key={i} className="flex items-center justify-between rounded border border-black/10 bg-white p-3">
                <span className="text-sm">{new Date(p.data_pagamento).toLocaleDateString('it-IT')}</span>
                <span className="font-semibold">{euro(p.importo)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
