import Image from 'next/image'
import { ClientNav } from '@/components/client-nav'
import { EBAY_URL } from '@/lib/ebay'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f1e6] pb-20 text-black">
      <section className="bg-[#092145] px-5 py-10">
        <Image
          src="/logo.jpg"
          alt="TrovaLibro.MO"
          width={1024}
          height={576}
          priority
          className="mx-auto w-full max-w-lg"
        />
      </section>

      <section className="mx-auto flex max-w-xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Libri usati in conto vendita, a Modena</h1>
        <p className="text-lg leading-relaxed">
          Affidaci i tuoi libri: li mettiamo in vendita sul nostro negozio eBay e tu segui tutto
          dal telefono — lo stato di ogni libro e quanto ti spetta, in ogni momento.
        </p>
        <a
          href={EBAY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-[#F4BD25] p-4 text-center text-lg font-semibold"
        >
          Visita il negozio eBay
        </a>
        <p className="text-sm text-black/70">
          Hai dei libri in conto vendita con noi? Apri il tuo <strong>link personale</strong> — o
          tocca <strong>Profilo</strong> qui sotto e inserisci il tuo codice — per vedere i tuoi
          libri e il tuo conto.
        </p>
      </section>

      <footer className="mx-auto max-w-xl p-6 text-xs text-black/50">
        TrovaLibro.MO ·{' '}
        <a href="/admin" className="underline">
          Area admin
        </a>
      </footer>

      <ClientNav ebayUrl={EBAY_URL} />
    </main>
  )
}
