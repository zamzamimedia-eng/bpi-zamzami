import { DM_Sans } from 'next/font/google'
import { GlobalStateProvider } from '@/context/GolobalStateProvider';
import { ThemeProvider } from '@/layout/theme-provider/theme-provider';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-perfect-scrollbar/dist/css/styles.css';
import '@/styles/scss/style.scss';

// Font Family
const dm_sans = DM_Sans({
  weight: ["400", "500", "700"],
  display: "swap",
  subsets: ["latin"],
  variable: '--font-bpi-yzi'
})

// metadata
export const metadata = {
  metadataBase: new URL('https://bpi.zamzami.or.id'),
  title: 'BPI - Business Process Improvement System',
  description: 'Sistem Business Process Improvement untuk analisis dan optimasi proses bisnis',
  keywords: ['BPI', 'Business Process Improvement', 'Process Mapping', 'Lean', 'Kaizen'],
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}


export default function RootLayout({ children }) {

  return (
    <html lang="en" className={`${dm_sans.variable}`} data-bs-theme="dark">
      <body>
        <ThemeProvider>

          <GlobalStateProvider>
            {children}
          </GlobalStateProvider>
        </ThemeProvider>

      </body>
    </html>
  )
}
