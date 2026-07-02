const EBAY_URL = process.env.NEXT_PUBLIC_EBAY_STORE_URL ?? 'https://www.ebay.it/usr/trovalibro.mo'

export default async function ClienteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ codice: string }>
}) {
  const { codice } = await params
  return (
    <div className="min-h-screen bg-[#f5f1e6] pb-20">
      {children}
      <nav className="fixed inset-x-0 bottom-0 border-t border-black/20 bg-white">
        <div className="mx-auto flex max-w-xl">
          <a
            href={EBAY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center gap-0.5 p-2 text-xs"
          >
            <span aria-hidden className="text-xl">🛒</span>
            Negozio
          </a>
          <a href={`/c/${codice}/libri`} className="flex flex-1 flex-col items-center gap-0.5 p-2 text-xs">
            <span aria-hidden className="text-xl">📚</span>
            Libri
          </a>
          <a href={`/c/${codice}`} className="flex flex-1 flex-col items-center gap-0.5 p-2 text-xs">
            <span aria-hidden className="text-xl">👤</span>
            Profilo
          </a>
        </div>
      </nav>
    </div>
  )
}
