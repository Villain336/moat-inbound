import type { Metadata } from 'next';
import { MantineProvider, ColorSchemeScript, createTheme } from '@mantine/core';
import SessionProvider from '@/components/providers/SessionProvider';
import './globals.css';

const theme = createTheme({
  primaryColor: 'yellow',
  colors: {
    yellow: [
      '#fefce8', '#fef9c3', '#fef08a', '#fde68a', '#fcd34d',
      '#f5c518', '#d4a017', '#b8960f', '#92740c', '#713f12',
    ],
  },
  fontFamily: 'Outfit, sans-serif',
  fontFamilyMonospace: 'IBM Plex Mono, monospace',
  headings: { fontFamily: 'Outfit, sans-serif' },
  defaultRadius: 'md',
});

export const metadata: Metadata = {
  title: 'Moat — AI Inbound Defense System',
  description:
    'Your AI chief of staff that intercepts, qualifies, and handles the outreach flood before it reaches you.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <SessionProvider>{children}</SessionProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
