import { listCatalog } from '@/lib/data/catalog'
import { EBAY_URL } from '@/lib/ebay'

/** Vista del catalogo pubblico (soli dati pubblici). Server Component condiviso tra /libri e /c/[codice]/libri. */
export async function CatalogoView() {
  const libri = await listCatalog()
  const inVendita = libri.filter((l) => l.stato === 'in_vendita')
  const venduti = libri.filter((l) => l.stato === 'venduto')

  return (
    <main className="mx-auto max-w-xl p-5 text-black">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">I libri di TrovaLibro.MO</h1>
        <a
          href={EBAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded bg-[#F4BD25] px-4 py-2 font-semibold"
        >
          Compra su eBay
        </a>
      </header>

      <section className="mb-6">
        <h2 className="mb-2 text-lg font-semibold">In vendita ({inVendita.length})</h2>
        <ul className="flex flex-col gap-2">
          {inVendita.map((l, i) => (
            <li key={i} className="flex items-center justify-between rounded border border-black/10 bg-white p-3">
              <span>{l.titolo}</span>
              <span className="font-semibold">{l.prezzo.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        {inVendita.length === 0 && <p className="text-sm text-black/60">Nessun libro in vendita al momento.</p>}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Venduti ({venduti.length})</h2>
        <ul className="flex flex-col gap-2">
          {venduti.map((l, i) => (
            <li key={i} className="flex items-center justify-between rounded border border-black/10 bg-white p-3 opacity-70">
              <span>{l.titolo}</span>
              <span className="text-sm">Venduto · {l.prezzo.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        {venduti.length === 0 && <p className="text-sm text-black/60">Ancora nessuna vendita.</p>}
      </section>
    </main>
  )
}
