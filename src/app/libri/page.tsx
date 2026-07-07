import { CatalogoView } from '@/components/catalogo-view'
import { ClientNav } from '@/components/client-nav'
import { EBAY_URL } from '@/lib/ebay'

export const dynamic = 'force-dynamic'

/** Catalogo pubblico raggiungibile senza codice (dalla barra della home). */
export default function CatalogoPubblicoPage() {
  return (
    <div className="parch min-h-screen pb-24">
      <CatalogoView />
      <ClientNav ebayUrl={EBAY_URL} />
    </div>
  )
}
