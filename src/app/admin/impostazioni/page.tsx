import { getRawSettings } from '@/lib/data/settings'
import { saveSettingsAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function ImpostazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; errore?: string }>
}) {
  const { ok, errore } = await searchParams
  const s = await getRawSettings()
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h2 className="text-lg font-semibold">Impostazioni</h2>
      {ok && <p className="text-green-700">Salvato.</p>}
      {errore && <p className="text-red-600">Valori non validi (controlla gli scaglioni).</p>}
      <form action={saveSettingsAction} className="flex flex-col gap-3">
        <label className="flex flex-col">Commissione eBay (%)
          <input name="commissione_ebay_percent" type="number" step="0.01" defaultValue={s.commissione_ebay_percent} className="border p-2" />
        </label>
        <label className="flex flex-col">Giorni di maturazione
          <input name="giorni_maturazione" type="number" defaultValue={s.giorni_maturazione} className="border p-2" />
        </label>
        <label className="flex flex-col">Minimo prelievo (€)
          <input name="minimo_prelievo" type="number" step="0.01" defaultValue={s.minimo_prelievo} className="border p-2" />
        </label>
        <label className="flex flex-col">Scaglioni (JSON: lista di {'{maxPrice, sellerPercent}'}, uno con maxPrice null)
          <textarea name="scaglioni" rows={6} defaultValue={JSON.stringify(s.scaglioni, null, 2)} className="border p-2 font-mono text-sm" />
        </label>
        <button type="submit" className="bg-black p-2 text-white">Salva</button>
      </form>
    </div>
  )
}
