import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BASIS Cedar Park Science Olympiad — Team Hub",
  description:
    "Roster, team, and event-pairing hub for BASIS Cedar Park's Science Olympiad program, Division B and Division C.",
};

const DIRECTION_CONTRACT = `
THESIS: A wall chart, not a dashboard — every roster member a coded tile findable in one glance, the whole team's shape visible even with every tile still open.
OWN-WORLD: Cream tile ground #f5f3ec, Division B blue #274b6d and Division C teal #3f8f82 as tile-top category bars, IBM Plex Sans for body, IBM Plex Mono for codes and numbers.
STORY: A captain opens the hub and sees both divisions' full team shape at once, then seats any open tile with a name in one action.
FIRST VIEWPORT: Header plaque, then Division B's four team-rows of tiles stacked above Division C's three, every tile dashed-open and numbered, nothing seated yet.
FORM: periodic-table wall chart, IMPECCABLE'S PICK on the direction round's grounded list, seed key 0edde575.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div
          aria-hidden
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }}
        />
        {children}
      </body>
    </html>
  );
}
