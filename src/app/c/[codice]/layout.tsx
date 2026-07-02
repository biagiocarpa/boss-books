import { ClientNav } from '@/components/client-nav'
import { EBAY_URL } from '@/lib/ebay'

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
      <ClientNav codice={codice} ebayUrl={EBAY_URL} />
    </div>
  )
}
