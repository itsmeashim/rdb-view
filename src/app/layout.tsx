import type { Metadata } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { DatabaseProvider } from '@/context/DatabaseContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'RDB View - HTTPX Data Viewer',
  description: 'View and analyze HTTPX reconnaissance data',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider>
            <DatabaseProvider>{children}</DatabaseProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
