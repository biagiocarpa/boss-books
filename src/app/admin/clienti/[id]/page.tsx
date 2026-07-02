import { notFound } from 'next/navigation'
import { getClient } from '@/lib/data/clients'
import { listBooksByClient } from '@/lib/data/books'
import { addBookAction, markSoldAction, markReturnedAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function ClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cliente = await getClient(id)
  if (!cliente) notFound()
  const libri = await listBooksByClient(id)

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold">
        {cliente.nome} <span className="font-mono text-sm text-black/60">({cliente.id})</span>
      </h2>

      <section>
        <h3 className="mb-2 font-semibold">Aggiungi libro</h3>
        <form action={addBookAction.bind(null, id)} className="flex flex-wrap gap-2">
          <input name="titolo" placeholder="Titolo" required className="border p-2" />
          <input name="prezzo_listino" type="number" step="0.01" min="0" placeholder="Prezzo €" required className="border p-2" />
          <button type="submit" className="bg-black px-3 text-white">Aggiungi</button>
        </form>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Libri ({libri.length})</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/20 text-left">
              <th className="py-1">SKU</th><th>Titolo</th><th>Stato</th><th>Prezzo vend.</th><th>Quota cliente</th><th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {libri.map((l) => (
              <tr key={l.sku} className="border-b border-black/10">
                <td className="py-1 font-mono text-xs">{l.sku}</td>
                <td>{l.titolo}</td>
                <td>{l.stato}</td>
                <td>{l.prezzo_vendita != null ? `${l.prezzo_vendita.toFixed(2)} €` : '—'}</td>
                <td>{l.quota_cliente != null ? `${l.quota_cliente.toFixed(2)} €` : '—'}</td>
                <td className="flex gap-2 py-1">
                  {l.stato === 'in_vendita' && (
                    <form action={markSoldAction.bind(null, id)} className="flex gap-1">
                      <input type="hidden" name="sku" value={l.sku} />
                      <input name="prezzo_vendita" type="number" step="0.01" min="0" placeholder="€ vend." required className="w-24 border p-1" />
                      <button type="submit" className="bg-green-700 px-2 text-white">Venduto</button>
                    </form>
                  )}
                  {l.stato === 'venduto' && (
                    <form action={markReturnedAction.bind(null, id)}>
                      <input type="hidden" name="sku" value={l.sku} />
                      <button type="submit" className="border px-2">Reso</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
