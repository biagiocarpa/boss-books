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
    <div className="parch font-libro min-h-screen pb-24">
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-5 text-black">
        <div className="cornice mt-3 px-4 py-6 text-center">
          <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— IL TUO PROFILO —</div>
          <p className="mt-3 text-lg leading-relaxed">
            Inserisci il tuo <strong>codice personale a 8 cifre</strong> per vedere i tuoi libri e
            il tuo conto. Lo trovi nel link che ti abbiamo dato al ritiro dei libri.
          </p>
          {errore && (
            <p className="mt-3 rounded bg-red-100 p-3 text-sm text-red-700">
              Codice non valido: deve essere di 8 cifre.
            </p>
          )}
          <form action={vaiAlProfiloAction} className="mt-4 flex flex-col gap-3">
            <input
              name="codice"
              inputMode="numeric"
              pattern="[0-9]{8}"
              maxLength={8}
              placeholder="es. 12345678"
              required
              className="rounded-sm border border-[#092145]/60 bg-white/80 p-3 text-center font-mono text-2xl tracking-widest"
            />
            <button type="submit" className="ink-btn text-lg">
              Apri il mio profilo
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[#3d4c63]">
          Non hai un codice? Chiedilo a chi ha ritirato i tuoi libri.
        </p>
      </main>
      <ClientNav ebayUrl={EBAY_URL} />
    </div>
  )
}
