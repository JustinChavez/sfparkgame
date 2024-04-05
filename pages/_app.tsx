// pages/_app.tsx

import '@/styles/globals.css';
import Script from 'next/script';

import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {

  return (
    <main>
      <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-P3TQJ0J738"/>
      <Script id="google-analytics" strategy="afterInteractive">
      {`window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-P3TQJ0J738');
      `}
      </Script>
      <Component {...pageProps} />
    </main>
  );
}