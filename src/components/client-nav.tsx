'use client'
import { usePathname } from 'next/navigation'

/**
 * Barra di navigazione a 3 icone (Negozio / Libri / Profilo). Solo UI, nessun accesso a dati.
 * Con `codice` punta alle pagine personali; senza, alle varianti pubbliche (/libri, /profilo).
 */
export function ClientNav({ codice, ebayUrl }: { codice?: string; ebayUrl: string }) {
  const pathname = usePathname()
  const profiloHref = codice ? `/c/${codice}` : '/profilo'
  const libriHref = codice ? `/c/${codice}/libri` : '/libri'
  const isLibri = pathname === libriHref
  const isProfilo = pathname === profiloHref

  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 p-2 text-xs ${
      active ? 'font-semibold text-[#092145] border-t-2 border-[#092145] -mt-px bg-[#f5f1e6]' : 'text-black/70'
    }`

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-black/20 bg-white">
      <div className="mx-auto flex max-w-xl">
        <a href={ebayUrl} target="_blank" rel="noopener noreferrer" className={item(false)}>
          <span aria-hidden className="text-xl">🛒</span>
          Negozio
        </a>
        <a href={libriHref} className={item(isLibri)} aria-current={isLibri ? 'page' : undefined}>
          <span aria-hidden className="text-xl">📚</span>
          Libri
        </a>
        <a href={profiloHref} className={item(isProfilo)} aria-current={isProfilo ? 'page' : undefined}>
          <span aria-hidden className="text-xl">👤</span>
          Profilo
        </a>
      </div>
    </nav>
  )
}
