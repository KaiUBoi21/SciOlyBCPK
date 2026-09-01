import { requireUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import CompetitionsBoard, {
  type DivisionData,
  type ResultRow,
} from "./competitions-board";

export const metadata = { title: "Competitions — BCP SciOly" };

const DIVISION_META = {
  B: { name: "Division B", subtitle: "Middle School", colorVar: "--division-b" },
  C: { name: "Division C", subtitle: "High School", colorVar: "--division-c" },
} as const;

type ScoreRow = {
  id: string;
  competition_id: string;
  placement: number | null;
  points: number | null;
  notes: string;
  events: { name: string } | null;
  teams: { code: string } | null;
};

export default async function CompetitionsPage() {
  await requireUser();
  const supabase = await createClient();

  const [
    { data: competitionRows },
    { data: scoreRows },
    { data: eventRows },
    { data: teamRows },
  ] = await Promise.all([
    supabase
      .from("competitions")
      .select("id, division, name, held_on, location")
      .order("held_on", { ascending: false, nullsFirst: false })
      .order("name"),
    supabase.from("competition_scores").select(
      `id, competition_id, placement, points, notes,
       events ( name ),
       teams ( code )`
    ),
    supabase.from("events").select("id, division, name").order("name"),
    supabase.from("teams").select("id, division, name, code").order("code"),
  ]);

  const resultsByCompetition = new Map<string, ResultRow[]>();
  for (const row of (scoreRows ?? []) as ScoreRow[]) {
    const list = resultsByCompetition.get(row.competition_id) ?? [];
    list.push({
      id: row.id,
      eventName: row.events?.name ?? "—",
      teamLabel: row.teams?.code ?? "—",
      placement: row.placement,
      points: row.points,
      notes: row.notes,
    });
    resultsByCompetition.set(row.competition_id, list);
  }

  const divisions: DivisionData[] = (["B", "C"] as const).map((code) => ({
    code,
    ...DIVISION_META[code],
    events: (eventRows ?? []).filter((e) => e.division === code),
    teams: (teamRows ?? []).filter((t) => t.division === code),
    competitions: (competitionRows ?? [])
      .filter((c) => c.division === code)
      .map((c) => ({
        id: c.id,
        name: c.name,
        heldOn: c.held_on,
        location: c.location,
        results: (resultsByCompetition.get(c.id) ?? []).sort(
          (a, b) =>
            a.eventName.localeCompare(b.eventName) ||
            a.teamLabel.localeCompare(b.teamLabel)
        ),
      })),
  }));

  return <CompetitionsBoard divisions={divisions} />;
}
