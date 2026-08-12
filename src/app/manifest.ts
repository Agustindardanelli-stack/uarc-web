import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UARC Web / Gestión de Árbitros',
    short_name: 'UARC App',
    description: 'Sistema de gestión de cuotas societarias y árbitros',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0f172a',
    icons: [
      {
        src: 'public/UarcLogo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'public/UarcLogo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}