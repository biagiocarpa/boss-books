import Image from 'next/image'
import { ClientNav } from '@/components/client-nav'
import { EBAY_URL } from '@/lib/ebay'

export default function Home() {
  return (
    <main className="parch parch-invecchiata font-libro relative min-h-screen pb-24 text-black">
      <span aria-hidden className="absolute left-3 top-2 text-xl text-[#8b3a2e]">❝</span>
      <span aria-hidden className="absolute right-3 top-2 text-xl text-[#8b3a2e]">❞</span>

      <div className="mx-auto max-w-xl px-6 pt-8">
        <section className="cornice relative px-4 py-6 text-center">
          <div className="text-[10px] tracking-[4px] text-[#8b3a2e]">— EX LIBRIS —</div>
          <Image
            src="/icon-192.png"
            alt="Stemma TrovaLibro.MO"
            width={88}
            height={88}
            priority
            className="mx-auto mt-2 rounded-md"
          />
          <h1 className="mt-2 text-3xl font-bold text-[#092145]">TrovaLibro.MO</h1>
          <div aria-hidden className="text-2xl leading-none text-[#8b3a2e]">❦</div>
          <p className="italic text-[#3d4c63]">Ogni libro trova il suo lettore</p>
          <div className="ceralacca absolute -bottom-4 -right-3">MO</div>
        </section>

        <p className="mt-6 text-[17px] leading-relaxed">
          <span aria-hidden className="float-left pr-2 text-5xl font-bold leading-[0.8] text-[#8b3a2e]">
            A
          </span>
          ffidaci i tuoi libri: li mettiamo in vendita sul nostro negozio eBay e tu segui tutto dal
          telefono — lo stato di ogni libro e quanto ti spetta, in ogni momento.
        </p>

        <a href={EBAY_URL} target="_blank" rel="noopener noreferrer" className="ink-btn mt-6 text-lg">
          Visita il negozio eBay
        </a>

        <p className="mt-5 text-sm text-[#3d4c63]">
          Hai dei libri in conto vendita con noi? Apri il tuo <strong>link personale</strong> — o
          tocca <strong>Profilo</strong> qui sotto e inserisci il tuo codice — per vedere i tuoi
          libri e il tuo conto.
        </p>

        <footer className="mt-8 text-center text-xs text-[#6b5535]">
          <span aria-hidden>❦</span> TrovaLibro.MO ·{' '}
          <a href="/admin" className="underline">
            Area admin
          </a>{' '}
          <span aria-hidden>❦</span>
        </footer>
      </div>

      <ClientNav ebayUrl={EBAY_URL} />
    </main>
  )
}
