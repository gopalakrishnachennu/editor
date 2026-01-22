import type { Metadata } from "next";
import { Outfit, Inter, Roboto, Open_Sans, Montserrat, Poppins, Playfair_Display, Lora, Oswald, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import "@/lib/init-logger"; // Initialize ultra-detailed logging

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const roboto = Roboto({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-roboto" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const poppins = Poppins({ weight: ["400", "600", "700"], subsets: ["latin"], variable: "--font-poppins" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const metadata: Metadata = {
  title: "Post Designer - AI-Powered Social Media Posts",
  description:
    "Create stunning social media posts with AI. Optimized for Indian audiences.",
  keywords: [
    "post designer",
    "social media",
    "instagram",
    "ai poster",
    "content creator",
    "indian",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable} ${roboto.variable} ${openSans.variable} ${montserrat.variable} ${poppins.variable} ${playfair.variable} ${lora.variable} ${oswald.variable} ${bebas.variable}`}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

