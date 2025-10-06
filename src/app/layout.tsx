import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ConnectionStatusBanner } from '@/components/layout/ConnectionStatusBanner';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { DeviceStatusMonitor } from '@/components/layout/DeviceStatusMonitor';
import { LanguageProvider } from '@/context/LanguageContext';
import { SplashScreen } from '@/components/layout/SplashScreen';

export const metadata: Metadata = {
  title: 'Velocity Driver',
  description: 'Quick Commerce Delivery Partner App',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
              <SplashScreen />
              {children}
              <Toaster />
              <ConnectionStatusBanner />
              <DeviceStatusMonitor />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
