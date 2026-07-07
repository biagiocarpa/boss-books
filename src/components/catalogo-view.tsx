import { listCatalog } from '@/lib/data/catalog'
import { EBAY_URL } from '@/lib/ebay'

/** Vista del catalogo pubblico (soli dati pubblici). Server Component condiviso tra /libri e /c/[codice]/libri. */
export async function CatalogoView() {
  const libri = await listCatalog()
  const inVendita = libri.filter((l) => l.stato === 'in_vendita')
  const venduti = libri.filter((l) => l.stato === 'venduto')

  return (
    <main className="font-libro mx-auto max-w-xl p-5 text-black">
      <header className="border-b-2 border-[#092145] pb-2 text-center">
        <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— REGISTRO DEI LIBRI —</div>
        <h1 className="text-xl font-bold text-[#092145]">TrovaLibro.MO</h1>
      </header>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> In vendita ({inVendita.length}) <span aria-hidden>❦</span>
        </h2>
        <ul>
          {inVendita.map((l, i) => (
            <li key={i} className="riga text-[15px]">
              <span>{l.titolo}</span>
              <span className="whitespace-nowrap font-bold text-[#092145]">{l.prezzo.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        {inVendita.length === 0 && (
          <p className="text-sm text-black/60">Nessun libro in vendita al momento.</p>
        )}
      </section>

      <section>
        <h2 className="titolo-sez">
          <span aria-hidden>❦</span> Venduti ({venduti.length}) <span aria-hidden>❦</span>
        </h2>
        <ul>
          {venduti.map((l, i) => (
            <li key={i} className="riga text-[15px] opacity-65">
              <span>{l.titolo}</span>
              <span className="whitespace-nowrap">
                <span className="timbro">Venduto</span> {l.prezzo.toFixed(2)} €
              </span>
            </li>
          ))}
        </ul>
        {venduti.length === 0 && <p className="text-sm text-black/60">Ancora nessuna vendita.</p>}
      </section>

      <a href={EBAY_URL} target="_blank" rel="noopener noreferrer" className="ink-btn mt-6">
        Compra su eBay
      </a>
    </main>
  )
}
