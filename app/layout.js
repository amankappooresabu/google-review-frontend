import "./globals.css";

export const metadata = {
  title: "Google Reviews Scraper",
  description: "Scrape Google reviews and export to CSV",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}