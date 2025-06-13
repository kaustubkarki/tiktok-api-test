// app/layout.tsx
import type { Metadata } from "next";
import { Source_Sans_3, Manrope } from "next/font/google";
import { siteDetails } from "@/data/siteDetails";

import "./globals.css";
import { getServerSession } from "next-auth";
import SessionWrapper from "@/components/SessionWrapper";
import { authOptions } from "./api/[...nextauth]/route";

const manrope = Manrope({ subsets: ["latin"] });
const sourceSans = Source_Sans_3({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: siteDetails.metadata.title,
  description: siteDetails.metadata.description,
  openGraph: {
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    url: siteDetails.siteUrl,
    type: "website",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 675,
        alt: siteDetails.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    images: ["/images/twitter-image.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch the session data on the server
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${manrope.className} ${sourceSans.className} antialiased`}
      >
        <SessionWrapper session={session}>
          <main>{children}</main>
        </SessionWrapper>
      </body>
    </html>
  );
}
