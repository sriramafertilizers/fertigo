import type { Metadata } from 'next';
import { Rethink_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/lib/providers';
import Navbar from '@/components/navbar';

const rethinkSans = Rethink_Sans({
  subsets: ['latin'],
  variable: '--font-rethink',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Fertigo — The simple ERP for agri shops',
  description: 'Practical, fast, mobile-friendly ERP designed for fertilizer and agricultural retail shops.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rethinkSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rethink+Sans:ital,wght@0,400..800;1,400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh w-full max-w-full overflow-x-hidden bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <Providers>
          <div className="flex flex-col min-h-dvh w-full max-w-full overflow-x-hidden">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 w-full">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div>
                  <span className="font-semibold text-slate-700">Fertigo</span> — The simple ERP for agri shops
                </div>
                <div>First Customer: <span className="font-medium text-emerald-700">SriRama Fertilizers</span></div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
