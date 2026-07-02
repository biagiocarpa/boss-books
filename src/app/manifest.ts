import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrovaLibro.MO',
    short_name: 'TrovaLibro.MO',
    description:
      'Libri usati in conto vendita a Modena — segui lo stato dei tuoi libri e il tuo conto.',
    start_url: '/',
    display: 'standalone',
    background_color: '#092145',
    theme_color: '#092145',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
