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
    <main className="font-libro mx-auto max-w-xl p-5 text-black">
      <header className="text-center">
        <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— LIBRETTO DEL CONTO —</div>
        <h1 className="text-2xl font-bold text-[#092145]">Ciao {cliente.nome}</h1>
        <p className="font-mono text-xs text-[#6b5535]">codice {cliente.id}</p>
      </header>

      <section className="cornice mt-4 px-4 py-3">
        <div className="riga border-b border-dotted border-[#092145]/45">
          <span className="font-bold">Disponibile</span>
          <span className="text-lg font-bold text-[#092145]">{euro(balance.available)}</span>
        </div>
        <div className="riga">
          <span>In maturazione</span>
          <span>{euro(balance.maturing)}</span>
        </div>
        <div className="riga">
          <span>In richiesta</span>
          <span>{euro(balance.requested)}</span>
        </div>
        <div className="riga border-b-0">
          <span>Già pagato</span>
          <span>{euro(balance.paid)}</span>
        </div>
      </section>

      <div className="mt-5">
        {pending ? (
          <p className="rounded bg-[#092145]/5 p-3 text-sm">
            Richiesta di {euro(pending.importo)} inviata, in lavorazione.
          </p>
        ) : balance.available > 0 ? (
          <form action={requestPaymentAction.bind(null, cliente.id)}>
            <button type="submit" className="ink-btn text-lg">
              Richiedi pagamento ({euro(balance.available)})
            </button>
          </form>
        ) : (
          <p className="text-sm text-[#3d4c63]">Nessun importo disponibile da richiedere.</p>
        )}
      </div>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> I tuoi libri ({libri.length}) <span aria-hidden>❦</span>
        </h2>
        <ul>
          {libri.map((l) => (
            <li key={l.sku} className="riga text-[15px]">
              <span>
                {l.titolo}{' '}
                {l.stato === 'venduto' || l.stato === 'pagato' ? (
                  <span className="timbro timbro-blu">{statoLabel(l)}</span>
                ) : (
                  <span className="text-xs italic text-[#3d4c63]">{statoLabel(l)}</span>
                )}
              </span>
              {l.quota_cliente != null && (
                <span className="whitespace-nowrap font-bold text-[#092145]">{euro(l.quota_cliente)}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> Pagamenti ricevuti <span aria-hidden>❦</span>
        </h2>
        {pagamenti.length === 0 ? (
          <p className="text-sm text-black/60">Nessun pagamento ricevuto finora.</p>
        ) : (
          <ul>
            {pagamenti.map((p, i) => (
              <li key={i} className="riga text-[15px]">
                <span className="text-sm">{new Date(p.data_pagamento).toLocaleDateString('it-IT')}</span>
                <span className="whitespace-nowrap">
                  <span className="timbro">Pagato</span> <b>{euro(p.importo)}</b>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
