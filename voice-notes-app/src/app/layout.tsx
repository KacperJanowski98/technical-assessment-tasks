import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { metadata as appMetadata } from './metadata';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = appMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen`}>
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="container mx-auto py-4 px-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Voice Notes App</h1>
              <nav>
                <ul className="flex space-x-4">
                  <li>
                    <a href="/" className="hover:text-blue-500 transition-colors">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="/dashboard" className="hover:text-blue-500 transition-colors">
                      Dashboard
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>
        {children}
        <footer className="bg-white dark:bg-gray-800 shadow-inner mt-12">
          <div className="container mx-auto py-6 px-4 text-center text-gray-500 dark:text-gray-400">
            <p>Smart Voice Notes Organizer - Task 2 Implementation</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
