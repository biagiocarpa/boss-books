import { ClientNav } from '@/components/client-nav'
import { EBAY_URL } from '@/lib/ebay'
import { vaiAlProfiloAction } from './actions'

/** Ingresso al profilo per chi arriva senza link personale: inserisce il suo codice a 8 cifre. */
export default async function ProfiloPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>
}) {
  const { errore } = await searchParams
  return (
    <div className="min-h-screen bg-[#f5f1e6] pb-20">
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-5 text-black">
        <h1 className="text-2xl font-semibold">Il tuo profilo</h1>
        <p className="text-lg leading-relaxed">
          Inserisci il tuo <strong>codice personale a 8 cifre</strong> per vedere i tuoi libri e il
          tuo conto. Lo trovi nel link che ti abbiamo dato al ritiro dei libri.
        </p>
        {errore && <p className="rounded bg-red-100 p-3 text-sm text-red-700">Codice non valido: deve essere di 8 cifre.</p>}
        <form action={vaiAlProfiloAction} className="flex flex-col gap-3">
          <input
            name="codice"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            placeholder="es. 12345678"
            required
            className="rounded border border-black/30 bg-white p-3 text-center font-mono text-2xl tracking-widest"
          />
          <button type="submit" className="rounded bg-black p-3 text-lg text-white">
            Apri il mio profilo
          </button>
        </form>
        <p className="text-sm text-black/60">
          Non hai un codice? Chiedilo a chi ha ritirato i tuoi libri.
        </p>
      </main>
      <ClientNav ebayUrl={EBAY_URL} />
    </div>
  )
}
