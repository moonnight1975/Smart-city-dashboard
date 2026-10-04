import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "MetroCity AI | Nalasopara Road Intelligence",
  description: "AI-assisted GIS road maintenance, citizen complaints, evidence workflows, and transparent governance for the Nalasopara pilot.",
  keywords: ["smart city", "dashboard", "urban monitoring", "traffic", "air quality", "IoT"],
  openGraph: {
    title: "MetroCity AI — Nalasopara Road Intelligence",
    description: "Evidence-based road maintenance and transparent governance",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="noise-bg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
