import "./globals.css";
import {Inter} from "next/font/google";
import Navbar from "../components/client/navbar";
import Footer from "../components/server/footer";
import {SpeedInsights} from "@vercel/speed-insights/next";
import {Analytics} from "@vercel/analytics/react";
const inter = Inter({subsets: ["latin"]});

export const metadata = {
  title: "No Off Season",
  description: "Property of No Off Season LLC",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        {children}
        <SpeedInsights />
        <Analytics />
        <Footer />
      </body>
    </html>
  );
}
