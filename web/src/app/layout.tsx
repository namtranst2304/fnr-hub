import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from '@/components/ui/ConfirmModal';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FNR Scheduler",
  description: "Automated system to scrape and rewrite Facebook posts using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen bg-white text-zinc-900 flex flex-col m-0 p-0 selection:bg-blue-100 selection:text-blue-900">
        <ConfirmProvider>
          {children}
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#000',
                color: '#00f3ff',
                border: '1px solid rgba(0, 243, 255, 0.3)',
                boxShadow: '0 0 10px rgba(0, 243, 255, 0.1)',
                borderRadius: '0px',
                fontFamily: 'monospace',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              },
              success: {
                iconTheme: {
                  primary: '#00f3ff',
                  secondary: '#000',
                },
              },
              error: {
                style: {
                  background: '#000',
                  color: '#ff0000',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                  boxShadow: '0 0 10px rgba(255, 0, 0, 0.1)',
                },
                iconTheme: {
                  primary: '#ff0000',
                  secondary: '#000',
                },
              },
            }}
          />
        </ConfirmProvider>
      </body>
    </html>
  );
}
