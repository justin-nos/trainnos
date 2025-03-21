import "./globals.css";
import {Inter} from "next/font/google";
import Navbar from "../components/client/navbar";
import Footer from "../components/server/footer";
import {SpeedInsights} from "@vercel/speed-insights/next";
import {Analytics} from "@vercel/analytics/react";
import {CSPostHogProvider} from "./providers";
const inter = Inter({subsets: ["latin"]});

export const metadata = {
  title: "Your Neighbor's Gym - No Off Season in Daphne, AL",
  description:
    "No Off Season is a gym in Daphne, Al. It is owned locally, by Brannon and Gavin Willisson. We exist to bring high-quality, encouraging exercise to all who need it. Our Address is: 25620 Friendship Rd, Daphne, AL 36526",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CSPostHogProvider>
          <Navbar />
          {children}
          <SpeedInsights />
          <Analytics />
          <Footer />
        </CSPostHogProvider>
      </body>
    </html>
  );
}
