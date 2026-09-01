import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import TestBankBoard, { type DivisionData } from "./test-bank-board";

export const metadata = { title: "Test Bank — BCP SciOly" };

const DIVISION_META = {
  B: { name: "Division B", subtitle: "Middle School", colorVar: "--division-b" },
  C: { name: "Division C", subtitle: "High School", colorVar: "--division-c" },
} as const;

type LinkRow = {
  id: string;
  division: "B" | "C";
  title: string;
  url: string;
  source: string;
  events: { name: string } | null;
};

export default async function TestBankPage() {
  await requireUser();
  const supabase = await createClient();

  const [{ data: linkRows }, { data: eventRows }] = await Promise.all([
    supabase
      .from("test_bank_links")
      .select("id, division, title, url, source, events ( name )")
      .order("created_at", { ascending: false }),
    supabase.from("events").select("id, division, name").order("name"),
  ]);

  const divisions: DivisionData[] = (["B", "C"] as const).map((code) => ({
    code,
    ...DIVISION_META[code],
    events: (eventRows ?? []).filter((e) => e.division === code),
    links: ((linkRows ?? []) as LinkRow[])
      .filter((l) => l.division === code)
      .map((l) => ({
        id: l.id,
        eventName: l.events?.name ?? null,
        title: l.title,
        url: l.url,
        source: l.source,
      })),
  }));

  return <TestBankBoard divisions={divisions} />;
}
