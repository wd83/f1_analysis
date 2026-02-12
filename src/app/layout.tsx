import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "F1 Track Performance Analyzer",
  description: "Analyze historical F1 performance data by track, team, and driver",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-f1-light">
        <header className="bg-f1-dark text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-f1-red rounded flex items-center justify-center font-bold text-lg">
              F1
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <a href="/" className="hover:text-f1-red transition-colors">
                  Track Performance Analyzer
                </a>
              </h1>
              <p className="text-sm text-gray-400">
                Historical race data &amp; statistics
              </p>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-f1-dark text-gray-500 text-center py-4 mt-12 text-sm">
          Data provided by the Ergast/Jolpica F1 API
        </footer>
      </body>
    </html>
  );
}
